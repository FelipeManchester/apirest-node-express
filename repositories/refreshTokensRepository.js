const pool = require('../db/pool');

async function criar({ aluno_id, token_hash, expira_em }) {
  const query = /*sql*/ `
  INSERT INTO refresh_tokens (aluno_id, token_hash, expira_em)
  VALUES ($1, $2, $3)
  RETURNING *
  `;

  const resultado = await pool.query(query, [aluno_id, token_hash, expira_em]);
  return resultado.rows[0];
}

async function buscarPorHash(token_hash) {
  const query = 'SELECT * FROM refresh_tokens WHERE token_hash = $1';
  const resultado = await pool.query(query, [token_hash]);

  return resultado.rows[0];
}

async function revogar(id) {
  const query = /*sql*/ `
  UPDATE refresh_tokens
  SET revogado_em = NOW()
  WHERE id = $1 AND revogado_em IS NULL
  returning *
  `;

  const resultado = await pool.query(query, [id]);
  return resultado.rows[0];
}

async function revogarTodosDoAluno(aluno_id) {
  const query = /*sql*/ `
  UPDATE refresh_tokens
  SET revogado_em = NOW()
  WHERE aluno_id = $1 AND revogado_em IS NULL
  `;

  await pool.query(query, [aluno_id]);
}

module.exports = { criar, buscarPorHash, revogar, revogarTodosDoAluno };
