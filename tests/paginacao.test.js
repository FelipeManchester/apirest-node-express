const request = require('supertest');
const app = require('../app');
const pool = require('../db/pool');
const { criarAlunoLogado, criarInstrutorLogado } = require('./ajudantes');

afterAll(() => pool.end());

describe('GET /alunos paginado', () => {
  it('devolve envelope com dados e paginação', async () => {
    const admin = await criarInstrutorLogado('admin');
    await criarAlunoLogado();

    const resposta = await request(app)
      .get('/alunos')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body.dados)).toBe(true);
    expect(resposta.body.paginacao).toMatchObject({ pagina: 1, limite: 20 });
    expect(typeof resposta.body.paginacao.total).toBe('number');
  });

  it('respeita o limite e muda de página', async () => {
    const admin = await criarInstrutorLogado('admin');
    await criarAlunoLogado();
    await criarAlunoLogado();
    await criarAlunoLogado();

    const p1 = await request(app)
      .get('/alunos?pagina=1&limite=2')
      .set('Authorization', `Bearer ${admin.token}`);

    const p2 = await request(app)
      .get('/alunos?pagina=2&limite=2')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(p1.body.dados).toHaveLength(2);
    expect(p2.body.dados).toHaveLength(2);
    expect(p1.body.dados.map((a) => a.id)).not.toEqual(
      p2.body.dados.map((a) => a.id),
    );
  });

  it('ordena de verdade', async () => {
    const admin = await criarInstrutorLogado('admin');

    // nomes controlados e um prefixo único, para isolar estes três alunos
    // dos outros que a suíte cria com nomes repetidos
    const prefixo = `ord${Date.now()}`;

    for (const sufixo of ['c', 'a', 'b']) {
      await request(app)
        .post('/alunos')
        .send({
          nome: `${prefixo}_${sufixo}`,
          email: `${prefixo}_${sufixo}@example.com`,
          data_nascimento: '1990-01-01',
          senha: 'senha123',
        });
    }

    const asc = await request(app)
      .get(`/alunos?nome=${prefixo}&ordenar_por=nome&ordem=asc`)
      .set('Authorization', `Bearer ${admin.token}`);

    const desc = await request(app)
      .get(`/alunos?nome=${prefixo}&ordenar_por=nome&ordem=desc`)
      .set('Authorization', `Bearer ${admin.token}`);

    const nomesAsc = asc.body.dados.map((a) => a.nome);
    const nomesDesc = desc.body.dados.map((a) => a.nome);

    expect(nomesAsc).toEqual([
      `${prefixo}_a`,
      `${prefixo}_b`,
      `${prefixo}_c`,
    ]);
    expect(nomesDesc).toEqual([...nomesAsc].reverse());
  });

  it('filtra por nome e ajusta o total', async () => {
    const admin = await criarInstrutorLogado('admin');
    await criarAlunoLogado();

    const semFiltro = await request(app)
      .get('/alunos')
      .set('Authorization', `Bearer ${admin.token}`);

    const comFiltro = await request(app)
      .get('/alunos?nome=zzznaoexiste')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(comFiltro.status).toBe(200);
    expect(comFiltro.body.dados).toHaveLength(0);
    expect(comFiltro.body.paginacao.total).toBe(0);
    expect(semFiltro.body.paginacao.total).toBeGreaterThan(0);
  });

  it('recusa coluna de ordenação fora da lista', async () => {
    const admin = await criarInstrutorLogado('admin');

    const resposta = await request(app)
      .get('/alunos?ordenar_por=senha_hash')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(resposta.status).toBe(400);
  });

  it('recusa limite acima do máximo', async () => {
    const admin = await criarInstrutorLogado('admin');

    const resposta = await request(app)
      .get('/alunos?limite=99999')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(resposta.status).toBe(400);
  });
});

describe('outras listagens paginadas', () => {
  it('GET /instrutores devolve envelope e filtra', async () => {
    await criarInstrutorLogado();

    const resposta = await request(app).get('/instrutores?limite=5');

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados.length).toBeLessThanOrEqual(5);
    expect(resposta.body.paginacao.limite).toBe(5);
  });

  it('GET /aulas mantém o filtro por instrutor_id', async () => {
    const admin = await criarInstrutorLogado('admin');
    const instrutor = await criarInstrutorLogado();

    await request(app)
      .post('/aulas')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        nome: 'Aula do filtro',
        instrutor_id: instrutor.id,
        dia_semana: 'terca',
        hora_inicio: '10:00',
        duracao_minutos: 60,
        capacidade_maxima: 10,
      });

    const resposta = await request(app).get(
      `/aulas?instrutor_id=${instrutor.id}`,
    );

    expect(resposta.status).toBe(200);
    expect(resposta.body.dados).toHaveLength(1);
    expect(resposta.body.dados[0].instrutor_id).toBe(instrutor.id);
  });

  it('GET /aulas recusa dia_semana inválido', async () => {
    const resposta = await request(app).get('/aulas?dia_semana=sabadao');

    expect(resposta.status).toBe(400);
  });
});
