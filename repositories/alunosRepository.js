const pool = require('../db/pool');

// LISTAR OS ALUNOS

async function listar() {
  const query =
    'SELECT id, nome, email, data_nascimento, criado_em FROM alunos ORDER BY id';
  const resultado = await pool.query(query);
  return resultado.rows;
}

// CRIAR OS ALUNOS
async function criar({ nome, email, data_nascimento, senha_hash }) {
  const query =
    'INSERT INTO alunos (nome, email, data_nascimento, senha_hash) VALUES ($1, $2, $3, $4) RETURNING *';
  const resultado = await pool.query(query, [
    nome,
    email,
    data_nascimento,
    senha_hash,
  ]);

  return resultado.rows[0];
}

// BUSCAR ALUNO POR ID

async function buscarPorId(id) {
  const query = 'SELECT * FROM alunos WHERE id = $1';

  const resultado = await pool.query(query, [id]);

  return resultado.rows[0];
}

async function buscarPorEmail(email) {
  const query = 'SELECT * FROM alunos WHERE email = $1';

  const resultado = await pool.query(query, [email]);

  return resultado.rows[0];
}

module.exports = { listar, criar, buscarPorId, buscarPorEmail };
