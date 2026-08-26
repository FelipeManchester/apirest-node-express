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

const COOKIE_REFRESH = 'refresh_token';

function opcoesCookieRefresh() {
  const emProducao = process.env.NODE_ENV === 'production';

  const entreSites = process.env.COOKIE_CROSS_SITE === 'true';

  return {
    httpOnly: true,
    secure: emProducao || entreSites,
    sameSite: entreSites ? 'none' : 'lax',
    path: '/auth',
    maxAge: DIAS_DE_VALIDADE * 24 * 60 * 60 * 1000,
  };
}

module.exports = {
  gerarRefreshToken,
  hashRefreshToken,
  calcularExpiracao,
  opcoesCookieRefresh,
  COOKIE_REFRESH,
};
