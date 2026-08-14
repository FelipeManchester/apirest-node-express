const { execSync } = require('node:child_process');
const { Client } = require('pg');

module.exports = async () => {
  require('dotenv').config({ path: '.env.test', override: true, quiet: true });

  const url = new URL(process.env.DATABASE_URL);
  const nomeDoBanco = url.pathname.slice(1);

  if (!nomeDoBanco.endsWith('_test')) {
    throw new Error(
      `Recusando rodar testes contra o banco "${nomeDoBanco}": o nome precisa terminar em _test.`,
    );
  }

  // conecta no banco administrativo pra poder dropar/criar o de teste

  const urlAdmin = new URL(process.env.DATABASE_URL);
  urlAdmin.pathname = '/postgres';

  const client = new Client({ connectionString: urlAdmin.toString() });

  await client.connect();
  await client.query(`DROP DATABASE IF EXISTS ${nomeDoBanco}`);
  await client.query(`CREATE DATABASE ${nomeDoBanco}`);
  await client.end();

  execSync('npx node-pg-migrate up', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: 'ignore',
  });
};
