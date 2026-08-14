// Uso: node testar-corrida.js
// Cria uma aula de 1 vaga e dispara N matrículas simultâneas nela.
const BASE = 'http://localhost:3000';

const ADMIN = { email: 'admin@studiofit.com', senha: 'senha_forte_do_admin' };
const QUANTIDADE = 8;

async function json(url, opcoes = {}) {
  const resposta = await fetch(BASE + url, {
    ...opcoes,
    headers: { 'Content-Type': 'application/json', ...opcoes.headers },
  });
  return {
    status: resposta.status,
    corpo: await resposta.json().catch(() => null),
  };
}

async function main() {
  const login = await json('/auth/instrutores/login', {
    method: 'POST',
    body: JSON.stringify(ADMIN),
  });
  const tokenAdmin = login.corpo.access_token;

  if (!tokenAdmin) {
    throw new Error(`login de admin falhou: ${JSON.stringify(login.corpo)}`);
  }

  const sufixo = Date.now();

  // instrutor novo a cada execução: a aula de teste nunca conflita
  // com a agenda de ninguém (Regra 3, parte 5)
  const instrutor = await json('/instrutores', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenAdmin}` },
    body: JSON.stringify({
      nome: `Instrutor Corrida ${sufixo}`,
      especialidade: 'testes',
    }),
  });

  // um aluno por requisição — matrícula duplicada do mesmo aluno
  // seria barrada pelo índice único, e não é isso que queremos testar
  const tokens = [];

  for (let i = 0; i < QUANTIDADE; i++) {
    const email = `corrida${i}_${sufixo}@example.com`;

    await json('/alunos', {
      method: 'POST',
      body: JSON.stringify({
        nome: `Corrida ${i}`,
        email,
        data_nascimento: '1990-01-01',
        senha: 'senha123',
      }),
    });

    const sessao = await json('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha: 'senha123' }),
    });

    tokens.push(sessao.corpo.access_token);
  }

  const aula = await json('/aulas', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenAdmin}` },
    body: JSON.stringify({
      nome: `Corrida ${sufixo}`,
      instrutor_id: instrutor.corpo.id,
      dia_semana: 'domingo',
      hora_inicio: '23:59',
      duracao_minutos: 1,
      capacidade_maxima: 1,
    }),
  });

  const aulaId = aula.corpo.id;

  if (!aulaId) {
    throw new Error(`criação da aula falhou: ${JSON.stringify(aula.corpo)}`);
  }

  const resultados = await Promise.all(
    tokens.map((token) =>
      json(`/aulas/${aulaId}/matriculas`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.status),
    ),
  );

  const criadas = resultados.filter((status) => status === 201).length;

  console.log('aula', aulaId, '| capacidade 1 |', QUANTIDADE, 'simultâneas');
  console.log('status:', resultados.join(', '));
  console.log(
    criadas === 1 ? 'OK: exatamente 1 matrícula' : `FALHOU: ${criadas} matrículas`,
  );
}

main();
