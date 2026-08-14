const request = require('supertest');
const app = require('../app');
const pool = require('../db/pool');

afterAll(() => pool.end());

function alunoValido(extra = {}) {
  return {
    nome: 'Aluno Teste',
    email: `aluno${Date.now()}.${Math.random()}@example.com`,
    data_nascimento: '1990-01-01',
    senha: 'senha123',
    ...extra,
  };
}

describe('POST /alunos', () => {
  it('cria aluno com dados válidos', async () => {
    const resposta = await request(app).post('/alunos').send(alunoValido());

    expect(resposta.status).toBe(201);
    expect(resposta.body).toHaveProperty('id');
    expect(resposta.body).not.toHaveProperty('senha_hash');
  });

  it('aplica trim no nome', async () => {
    const resposta = await request(app)
      .post('/alunos')
      .send(alunoValido({ nome: '     Joana Prado    ' }));

    expect(resposta.body.nome).toBe('Joana Prado');
  });

  it('recusa email inválido', async () => {
    const resposta = await request(app)
      .post('/alunos')
      .send(alunoValido({ email: 'nao-e-email' }));

    expect(resposta.status).toBe(400);
    expect(resposta.body.detalhes[0].campo).toBe('email');
  });

  it('recusa campo desconhecido', async () => {
    const resposta = await request(app)
      .post('/alunos')
      .send(alunoValido({ apelido: 'Jô' }));

    expect(resposta.status).toBe(400);
  });
});

describe('GET /alunos', () => {
  it('exige autenticação', async () => {
    const resposta = await request(app).get('/alunos');

    expect(resposta.status).toBe(401);
  });
});
