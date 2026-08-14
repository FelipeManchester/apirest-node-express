const request = require('supertest');
const app = require('../app');
const pool = require('../db/pool');
const { hashSenha } = require('../services/senhaService');

let contador = 0;
const unico = () => `${Date.now()}_${contador++}`;

async function criarAlunoLogado() {
  const email = `aluno_${unico()}@example.com`;

  await request(app).post('/alunos').send({
    nome: 'Aluno Teste',
    email,
    data_nascimento: '1990-01-01',
    senha: 'senha123',
  });

  const login = await request(app)
    .post('/auth/login')
    .send({ email, senha: 'senha123' });

  return {
    email,
    token: login.body.access_token,
    cookie: login.headers['set-cookie'],
  };
}

async function criarInstrutorLogado(papel = 'instrutor') {
  const email = `instrutor_${unico()}@studiofit.com`;
  const senha_hash = await hashSenha('senha123');

  const { rows } = await pool.query(
    /*SQL*/ `
    INSERT INTO instrutores (nome, especialidade, email, senha_hash, papel)
    VALUES ($1, 'testes', $2, $3, $4) RETURNING id
    `,
    [`Instrutor ${unico()}`, email, senha_hash, papel],
  );

  const login = await request(app)
    .post('/auth/instrutores/login')
    .send({ email, senha: 'senha123' });

  return {
    id: rows[0].id,
    token: login.body.access_token,
    cookie: login.headers['set-cookie'],
  };
}

async function criarAula(admin, dados = {}) {
  const instrutor = await criarInstrutorLogado();

  const resposta = await request(app)
    .post('/aulas')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      nome: `Aula ${unico()}`,
      instrutor_id: instrutor.id,
      dia_semana: 'segunda',
      hora_inicio: '07:00',
      duracao_minutos: 60,
      capacidade_maxima: 10,
      ...dados,
    });

  return { aula: resposta.body, instrutor };
}

module.exports = { criarAlunoLogado, criarInstrutorLogado, criarAula };
