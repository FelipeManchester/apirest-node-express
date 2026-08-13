const pool = require('../db/pool');

async function listar() {
  const query =
    'SELECT id, nome, especialidade,papel FROM instrutores ORDER BY id';
  const resultado = await pool.query(query);

  return resultado.rows;
}

async function buscarPorId(id) {
  const query = 'SELECT * FROM instrutores WHERE id = $1';
  const resultado = await pool.query(query, [id]);

  return resultado.rows[0];
}

async function criar({ nome, especialidade, email, senha_hash, papel }) {
  const query = /* sql */ `
    INSERT INTO instrutores (nome, especialidade, email, senha_hash, papel)
    VALUES ($1, $2, $3, $4, COALESCE($5, 'instrutor'))
    RETURNING id, nome, especialidade, email, papel
  `;
  const resultado = await pool.query(query, [
    nome,
    especialidade,
    email ?? null,
    senha_hash ?? null,
    papel ?? null,
  ]);

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

async function buscarPorEmail(email) {
  const query = 'SELECT * FROM instrutores WHERE email = $1';
  const resultado = await pool.query(query, [email]);

  return resultado.rows[0];
}

module.exports = {
  listar,
  buscarPorId,
  buscarPorEmail,
  criar,
  atualizar,
  remover,
};
