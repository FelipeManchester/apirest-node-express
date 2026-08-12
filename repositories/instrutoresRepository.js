const pool = require('../db/pool');

async function listar() {
  const query = 'SELECT * FROM instrutores ORDER BY id';
  const resultado = await pool.query(query);

  return resultado.rows;
}

async function buscarPorId(id) {
  const query = 'SELECT * FROM instrutores WHERE id = $1';
  const resultado = await pool.query(query, [id]);

  return resultado.rows[0];
}

async function criar({ nome, especialidade }) {
  const query =
    'INSERT INTO instrutores (nome, especialidade) VALUES ($1, $2) RETURNING *';
  const resultado = await pool.query(query, [nome, especialidade]);

  return resultado.rows[0];
}

async function atualizar(id, { nome, especialidade }) {
  const query = `
    UPDATE instrutores
    SET nome = COALESCE($1, nome),
        especialidade = COALESCE($2, especialidade)
    WHERE id = $3
    RETURNING *
  `;

  const resultado = await pool.query(query, [nome, especialidade, id]);

  return resultado.rows[0];
}

async function remover(id) {
  const query = 'DELETE FROM instrutores WHERE id = $1 RETURNING *';
  const resultado = await pool.query(query, [id]);

  return resultado.rows[0];
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
