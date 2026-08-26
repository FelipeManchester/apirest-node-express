const pino = require('pino');

const emProducao = process.env.NODE_ENV === 'production';

const logger = pino({
  enabled: process.env.NODE_ENV !== 'test',

  level: process.env.LOG_LEVEL || (emProducao ? 'info' : 'debug'),

  formatters: {
    level: (rotulo) => ({ level: rotulo }),
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  redact: {
    paths: [
      'req.headers.authorization',
      'req. headers.cookie',
      'res.headers["set-cookie"]',
      'senha',
      '*.senha',
      'senha_hash',
      '*.senha_hash',
      'access_token',
      '*.access_token',
      'refresh_token',
      '*.refresh_token',
    ],
    censor: '[SECRET]',
  },

  base: { servico: 'studio-fit-api' },
});

module.exports = logger;
