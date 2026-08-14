const pool = require('./pool');

async function executarEmTransacao(callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const resultado = await callback(client);

    await client.query('COMMIT');

    return resultado;
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }
}

module.exports = executarEmTransacao;
