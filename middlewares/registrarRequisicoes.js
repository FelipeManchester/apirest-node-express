const crypto = require('node:crypto');
const pinoHttp = require('pino-http');

const logger = require('../logger');

const registrarRequisicoes = pinoHttp({
  logger,

  genReqId(req, res) {
    const doProxy = req.headers['x-request-id'];
    const id = doProxy || crypto.randomUUID();

    res.setHeader('x-Request-Id', id);

    return id;
  },

  autoLogging: {
    ignore: (req) => req.url.startsWith('/health'),
  },

  customLogLevel(req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  customSuccessMessage(req, res) {
    return `${req.method} ${req.originalUrl} ${res.statusCode}`;
  },

  serializers: {
    req: (req) => ({
      id: req.id,
      metodo: req.method,
      url: req.originalUrl || req.url,
      ip: req.remoteAddress,
    }),
    res: (res) => ({ status: res.statusCode }),
  },
});

module.exports = registrarRequisicoes;
