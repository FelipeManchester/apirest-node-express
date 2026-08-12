const crypto = require('node:crypto');

const DIAS_DE_VALIDADE = 7;

function gerarRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function calcularExpiracao() {
  const agora = new Date();
  agora.setDate(agora.getDate() + DIAS_DE_VALIDADE);
  return agora;
}

module.exports = { gerarRefreshToken, hashRefreshToken, calcularExpiracao };
