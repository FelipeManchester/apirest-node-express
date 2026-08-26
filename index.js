require('dotenv').config();

const app = require('./app');
const logger = require('./logger');
const pool = require('./db/pool');
const { iniciarDesligamento } = require('./routes/health');

const PORT = process.env.PORT || 3000;

const servidor = app.listen(PORT, () => {
  logger.info({ porta: Number(PORT) }, 'servidor no ar');
});

function desligar(sinal) {
  logger.info({ sinal }, 'desligando');

  iniciarDesligamento();

  servidor.close(async () => {
    await pool.end();
    logger.info('conexões encerradas');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('desligamento demorou demais, saindo à força');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => desligar('SIGTERM'));
process.on('SIGINT', () => desligar('SIGINT'));
