const bcrypt = require('bcryptjs');

async function hashSenha(senha) {
  return bcrypt.hash(senha, 10);
}

async function compararSenha(senha, hash) {
  return bcrypt.compare(senha, hash);
}

module.exports = { hashSenha, compararSenha };
