const pool = require('../db/pool');

async function criar({ aluno_id, instrutor_id, token_hash, expira_em }) {
  const query = /*sql*/ `
  INSERT INTO refresh_tokens (aluno_id, instrutor_id, token_hash, expira_em)
  VALUES ($1, $2, $3, $4)
  RETURNING *
  `;

  const resultado = await pool.query(query, [
    aluno_id ?? null,
    instrutor_id ?? null,
    token_hash,
    expira_em,
  ]);
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

async function revogarTodosDoDono({ aluno_id, instrutor_id }) {
  const query = /*sql*/ `
    UPDATE refresh_tokens
    SET revogado_em = NOW()
    WHERE aluno_id IS NOT DISTINCT FROM $1
      AND instrutor_id IS NOT DISTINCT FROM $2
      AND revogado_em IS NULL
  `;

  await pool.query(query, [aluno_id ?? null, instrutor_id ?? null]);
}

async function removerExpirados(diasDeRetencao = 30) {
  const query = /* sql */ `
    DELETE FROM refresh_tokens
    WHERE expira_em < NOW() - ($1 || ' days')::interval
  `;

  const resultado = await pool.query(query, [diasDeRetencao]);
  return resultado.rowCount;
}

module.exports = {
  criar,
  buscarPorHash,
  revogar,
  revogarTodosDoDono,
  removerExpirados,
};
