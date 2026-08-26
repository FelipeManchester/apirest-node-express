# Studio Fit API

API REST de agendamento de aulas de uma academia. Alunos se cadastram, veem a grade e se matriculam; instrutores gerenciam as próprias aulas; admin gerencia todo mundo.

**No ar:** https://studio-fit-api.onrender.com
**Documentação interativa:** https://studio-fit-api.onrender.com/docs

> Primeira API que construí. Foi feita junto com uma trilha de estudo em 22 partes, do primeiro endpoint até o deploy — o material está em [github.com/FelipeManchester/materiais-de-estudo](https://github.com/FelipeManchester/materiais-de-estudo), na pasta `node-express/`.

---

## Sumário

- [O domínio](#o-domínio)
- [Tecnologias](#tecnologias)
- [Como rodar](#como-rodar)
- [Endpoints](#endpoints)
- [Arquitetura](#arquitetura)
- [Decisões de projeto](#decisões-de-projeto)
- [Testes e CI](#testes-e-ci)
- [Deploy](#deploy)
- [O que aprendi](#o-que-aprendi)

---

## O domínio

Quatro entidades: **aluno**, **instrutor**, **aula** e **matrícula**. Quatro regras de negócio, e cada uma resolvida de um jeito diferente de propósito:

| Regra                                               | Onde vive                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| 1. Aula não aceita mais matrículas que a capacidade | Código, dentro de transação com `SELECT ... FOR UPDATE`           |
| 2. Aluno não se matricula duas vezes na mesma aula  | Banco, com índice único parcial — o código captura o erro `23505` |
| 3. Instrutor não tem duas aulas no mesmo horário    | Banco, com o operador `OVERLAPS` do Postgres                      |
| 4. Cancelamento nunca é `DELETE`                    | Mudança de `status`, preservando o histórico                      |

A regra 1 foi implementada duas vezes. A primeira versão tinha uma condição de corrida real: disparando 8 matrículas simultâneas numa aula de 1 vaga, entravam 8. A segunda, com transação e lock de linha, deixa entrar 1.

## Tecnologias

**Runtime e framework**

- Node.js 24 · Express 5

**Persistência**

- PostgreSQL 16 · driver `pg` com pool de conexões
- `node-pg-migrate` para versionar o schema

**Autenticação**

- `jsonwebtoken` — access token de 15 min
- `bcryptjs` — hash de senha
- Refresh token de 7 dias em cookie `httpOnly`, rotacionado a cada uso, com detecção de reuso

**Validação e contrato**

- `zod` — schemas de entrada, com mensagens em pt-BR
- `swagger-ui-express` + `z.toJSONSchema` — spec OpenAPI 3.0.3 derivada dos próprios schemas

**Segurança de borda**

- `helmet` · `cors` · `express-rate-limit`

**Observabilidade**

- `pino` + `pino-http` — log estruturado em JSON, com request id

**Qualidade**

- Jest + Supertest, contra banco real
- ESLint
- GitHub Actions

## Como rodar

Só precisa de Docker. Node não é necessário para rodar — apenas para desenvolver.

```bash
git clone https://github.com/FelipeManchester/apirest-node-express.git
cd apirest-node-express

cp .env.example .env          # preencha as variáveis
docker compose up -d --build

docker compose exec api npm run migrate:up
```

A API sobe em `http://localhost:3000` e a documentação em `http://localhost:3000/docs`.

### Variáveis de ambiente

| Variável            | Para que serve                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | Conexão com o Postgres                                                                                |
| `POSTGRES_PASSWORD` | Senha que o container do banco usa ao inicializar. Precisa bater com a da `DATABASE_URL`              |
| `JWT_SECRET`        | Assinatura dos access tokens. Gere com `node -pe "require('crypto').randomBytes(32).toString('hex')"` |
| `CORS_ORIGINS`      | Origens permitidas, separadas por vírgula                                                             |
| `PORT`              | Porta da API (padrão 3000)                                                                            |
| `PUBLIC_URL`        | URL pública, usada no `servers` da spec OpenAPI. Só em produção                                       |
| `COOKIE_CROSS_SITE` | `true` quando o front está em outro domínio: liga `SameSite=None`                                     |

### Desenvolvendo localmente

O `docker-compose.yml` não publica a porta do Postgres. Para rodar a API fora do container (`npm run dev`) ou os testes, descomente o bloco `ports` do serviço `db`.

```bash
npm install
npm run dev        # nodemon, com log formatado pelo pino-pretty
npm test
npm run lint
```

## Endpoints

Vinte operações. A lista completa, com formatos de entrada e saída, está em [`/docs`](https://studio-fit-api.onrender.com/docs).

### Autenticação

```
POST   /auth/login                              público
POST   /auth/instrutores/login                  público
POST   /auth/refresh                            cookie
POST   /auth/logout                             cookie
```

### Alunos

```
POST   /alunos                                  público
GET    /alunos                                  admin
GET    /alunos/{id}/matriculas                  o próprio aluno
```

### Instrutores

```
GET    /instrutores                             público
GET    /instrutores/{id}                        público
POST   /instrutores                             admin
PATCH  /instrutores/{id}                        admin
DELETE /instrutores/{id}                        admin   (soft-delete)
```

### Aulas

```
GET    /aulas                                   público
GET    /aulas/{id}                              público
POST   /aulas                                   instrutor | admin
PATCH  /aulas/{id}                              instrutor (própria) | admin
DELETE /aulas/{id}                              instrutor (própria) | admin
```

### Matrículas

```
POST   /aulas/{id}/matriculas                   aluno
GET    /aulas/{id}/matriculas                   instrutor (própria) | admin
PATCH  /aulas/{id}/matriculas/{matriculaId}     o próprio aluno
```

### Operacionais

```
GET    /health                                  liveness — não consulta o banco
GET    /health/ready                            readiness — consulta o banco
GET    /docs                                    Swagger UI
GET    /docs.json                               spec OpenAPI crua
```

Listagens aceitam `?pagina=&limite=&ordenar_por=&ordem=` e filtros por recurso, e respondem com envelope:

```json
{
  "dados": [ ... ],
  "paginacao": { "pagina": 1, "limite": 20, "total": 20, "total_paginas": 1 }
}
```

## Arquitetura

Monolito modular em camadas. Cada camada só conversa com a de baixo.

```
routes/         HTTP: rotas, códigos de status, autorização
repositories/   SQL: a única camada que conhece o banco
schemas/        Zod: validação de entrada
middlewares/    autenticar, autorizar, validar, cors, rate limit, log
services/       senha (bcrypt) e tokens
docs/           spec OpenAPI, derivada dos schemas
db/             pool de conexões e helper de transação
errors/         ErroDeDominio — erro de negócio traduzido em HTTP num lugar só
migrations/     histórico versionado do schema
tests/          Jest + Supertest contra banco real
```

## Decisões de projeto

**Regra de negócio no banco quando o banco resolve melhor.** Duplicidade de matrícula é índice único; conflito de agenda é `OVERLAPS`. Validar isso só no código deixaria brecha para corrida.

**Transação onde há leitura seguida de escrita.** A verificação de vaga e a inserção da matrícula rodam na mesma transação, com `SELECT ... FOR UPDATE` na aula. Sem isso, duas requisições simultâneas leem "tem vaga" antes de qualquer uma escrever.

**Refresh token rotacionado, guardado em hash.** O banco nunca vê o token em claro — só o SHA-256. Cada uso invalida o anterior; se um token já revogado aparecer de novo, todas as sessões daquele usuário são derrubadas.

**Autorização em duas camadas.** O middleware `autorizar('admin')` filtra por papel; a posse do recurso é checada na rota. Papel não basta: um instrutor não pode editar a aula de outro instrutor.

**Documentação derivada, não escrita.** `z.toJSONSchema` converte os schemas Zod em OpenAPI. Mudou a validação, mudou a doc — não há como divergirem.

**Soft-delete onde há histórico.** Instrutor desativado sai das listagens mas as aulas passadas continuam existindo.

**Liveness separado de readiness.** `/health` não toca no banco de propósito: se ele falhasse durante uma instabilidade do Postgres, o orquestrador reiniciaria um processo saudável.

## Testes e CI

```bash
npm test
```

Jest + Supertest contra um Postgres de verdade, recriado a cada execução via migrations. A suíte se recusa a rodar se o banco não terminar em `_test` — guarda contra apontar para o banco de desenvolvimento por engano.

O GitHub Actions roda lint e testes a cada push, com Postgres como service container.

## Deploy

| Camada | Onde                             |
| ------ | -------------------------------- |
| API    | Render, a partir do `Dockerfile` |
| Banco  | Neon (Postgres gerenciado)       |

A configuração do Render está versionada em `render.yaml` — tipo de serviço, health check e variáveis, sem os segredos.

A imagem roda como usuário sem privilégio (`USER node`), com `HEALTHCHECK` apontando para `/health`. O processo trata `SIGTERM`: marca a readiness como indisponível, termina as requisições em andamento e fecha o pool antes de sair. `docker stop` leva ~0,2s em vez dos 10s do timeout.

Migrations são passo de deploy, executadas separadamente — nunca no boot do container, que quebraria com mais de uma réplica.

## O que aprendi

**Condição de corrida é real e silenciosa.** Só acreditei quando reproduzi: 8 matrículas simultâneas numa aula de 1 vaga, e todas as 8 entraram. `Promise.all` reproduz; `curl &` não.

**Erro que não aparece é o pior.** Vários bugs desta API não quebravam nada visivelmente: `ORDER BY $1` que não ordena e não avisa, `req.query` que no Express 5 é getter e ignora atribuição, `.refine()` do Zod descartado em silêncio na conversão para JSON Schema.

**Camada existe para ser trocada.** Reescrever a paginação inteira sem tocar em nenhuma rota só foi possível porque o SQL estava confinado nos repositories.

**Migration é o que impede o banco de virar folclore.** Antes delas, o `schema.sql` do repositório já tinha divergido do banco real — faltavam três colunas.

**Teste automatizado muda o que dá para fazer.** Com a suíte verde, refatorar deixou de ser aposta.

**Documentar revela bugs.** Escrever os códigos de resposta de cada rota obrigou a ler a API de fora, e apareceram coisas que ninguém tinha exercitado: email duplicado devolvia `500` em vez de `409`, e uma rota pública vazava `senha_hash`.

**Segurança é detalhe fora do caminho feliz.** O hash vazando num `SELECT *`, a senha do banco commitada num arquivo de teste, o `trust proxy` ausente fazendo o rate limit contar o mundo inteiro como um usuário — nada disso aparece testando a API normalmente.

**Produção liga código que parecia inútil.** `Secure` no cookie, `trust proxy`, health check, handler de `SIGTERM`: em `localhost` nenhum deles faz diferença visível. Todos passaram a fazer no dia do deploy.
