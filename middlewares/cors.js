const cors = require('cors');

const origensPermitidas = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean);

const corsConfigurado = cors({
  origin: origensPermitidas,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

module.exports = corsConfigurado;
