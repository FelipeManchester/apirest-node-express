const request = require('supertest');
const app = require('../app');
const pool = require('../db/pool');
const {
  criarAlunoLogado,
  criarInstrutorLogado,
  criarAula,
} = require('./ajudantes');

afterAll(() => pool.end());

describe('matriz de permissões', () => {
  it('GET /alunos: 401 sem token, 403 como aluno, 200 como admin', async () => {
    const aluno = await criarAlunoLogado();
    const admin = await criarInstrutorLogado('admin');

    expect((await request(app).get('/alunos')).status).toBe(401);

    expect(
      (
        await request(app)
          .get('/alunos')
          .set('Authorization', `Bearer ${aluno.token}`)
      ).status,
    ).toBe(403);

    expect(
      (
        await request(app)
          .get('/alunos')
          .set('Authorization', `Bearer ${admin.token}`)
      ).status,
    ).toBe(200);
  });

  it('Instrutor só edita as próprias aulas', async () => {
    const admin = await criarInstrutorLogado('admin');
    const { aula } = await criarAula(admin);
    const outro = await criarInstrutorLogado();

    const resposta = await request(app)
      .patch(`/aulas/${aula.id}`)
      .set('Authorization', `Bearer ${outro.token}`)
      .send({ nome: 'Roubada' });

    expect(resposta.status).toBe(403);
  });
});

describe('regras de negócio', () => {
  it('respeita a capacidade máxima', async () => {
    const admin = await criarInstrutorLogado('admin');
    const { aula } = await criarAula(admin, {
      capacidade_maxima: 1,
      hora_inicio: '08:00',
    });

    const primeiro = await criarAlunoLogado();
    const segundo = await criarAlunoLogado();

    const r1 = await request(app)
      .post(`/aulas/${aula.id}/matriculas`)
      .set('Authorization', `Bearer ${primeiro.token}`);

    const r2 = await request(app)
      .post(`/aulas/${aula.id}/matriculas`)
      .set('Authorization', `Bearer ${segundo.token}`);

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(409);
  });

  it('recusa matrícula duplicada', async () => {
    const admin = await criarInstrutorLogado('admin');
    const { aula } = await criarAula(admin, { hora_inicio: '09:00' });
    const aluno = await criarAlunoLogado();

    await request(app)
      .post(`/aulas/${aula.id}/matriculas`)
      .set('Authorization', `Bearer ${aluno.token}`);

    const segunda = await request(app)
      .post(`/aulas/${aula.id}/matriculas`)
      .set('Authorization', `Bearer ${aluno.token}`);

    expect(segunda.status).toBe(409);
  });
});

describe('fluxo de refresh', () => {
  it('renova com cookie e detecta reuso', async () => {
    const aluno = await criarAlunoLogado();

    const primeira = await request(app)
      .post('/auth/refresh')
      .set('Cookie', aluno.cookie);

    expect(primeira.status).toBe(200);
    expect(primeira.body).toHaveProperty('access_token');
    expect(primeira.body).not.toHaveProperty('refresh_token');

    // reapresentar o mesmo cookie: rotação já revogou (parte 8)
    const reuso = await request(app)
      .post('/auth/refresh')
      .set('Cookie', aluno.cookie);

    expect(reuso.status).toBe(401);
  });

  it('recusa refresh sem cookie', async () => {
    expect((await request(app).post('/auth/refresh')).status).toBe(401);
  });
});
