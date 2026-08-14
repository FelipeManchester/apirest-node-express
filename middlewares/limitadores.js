const rateLimit = require('express-rate-limit');

const limitadorGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 300, // por IP, por janela
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente em alguns minutos.' },
});

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  skipSuccessfulRequests: true,
  message: {
    erro: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  },
});

module.exports = { limitadorGlobal, limitadorLogin };
