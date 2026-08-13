const express = require('express');
const jwt = require('jsonwebtoken');

const { compararSenha } = require('../services/senhaService');
const {
  gerarRefreshToken,
  hashRefreshToken,
  calcularExpiracao,
  opcoesCookieRefresh,
  COOKIE_REFRESH,
} = require('../services/tokenService');
const alunosRepository = require('../repositories/alunosRepository');
const instrutoresRepository = require('../repositories/instrutoresRepository');
const refreshTokensRepository = require('../repositories/refreshTokensRepository');

const router = express.Router();

async function emitirTokens({ id, papel }) {
  const accessToken = jwt.sign(
    { usuario_id: id, papel },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  const refreshToken = gerarRefreshToken();

  await refreshTokensRepository.criar({
    aluno_id: papel === 'aluno' ? id : null,
    instrutor_id: papel === 'aluno' ? null : id,
    token_hash: hashRefreshToken(refreshToken),
    expira_em: calcularExpiracao(),
  });

  return { access_token: accessToken, refresh_token: refreshToken };
}

function responderComTokens(res, tokens) {
  res.cookie(COOKIE_REFRESH, tokens.refresh_token, opcoesCookieRefresh());
  res.json({ access_token: tokens.access_token });
}

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'email e senha são obrigatórios' });
  }

  const aluno = await alunosRepository.buscarPorEmail(email);
  if (!aluno) {
    return res.status(401).json({ erro: 'email ou senha inválidos' });
  }

  const senhaValida = await compararSenha(senha, aluno.senha_hash);

  if (!senhaValida) {
    return res.status(401).json({ erro: 'email ou senha inválidos' });
  }

  const tokens = await emitirTokens({ id: aluno.id, papel: 'aluno' });

  responderComTokens(res, tokens);
});

router.post('/instrutores/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'email e senha são obrigatórios' });
  }

  const instrutor = await instrutoresRepository.buscarPorEmail(email);

  if (!instrutor || !instrutor.senha_hash) {
    return res.status(401).json({ erro: 'email ou senha inválidos' });
  }

  const senhaValida = await compararSenha(senha, instrutor.senha_hash);

  if (!senhaValida) {
    return res.status(401).json({ erro: 'email ou senha inválidos' });
  }

  const tokens = await emitirTokens({
    id: instrutor.id,
    papel: instrutor.papel,
  });

  responderComTokens(res, tokens);
});

router.post('/refresh', async (req, res) => {
  const refresh_token = req.cookies[COOKIE_REFRESH];

  if (!refresh_token) {
    return res.status(401).json({ erro: 'Refresh token ausente' });
  }

  const registro = await refreshTokensRepository.buscarPorHash(
    hashRefreshToken(refresh_token),
  );

  if (!registro) {
    return res.status(401).json({ erro: 'Refresh token inválido' });
  }

  if (registro.revogado_em) {
    await refreshTokensRepository.revogarTodosDoDono({
      aluno_id: registro.aluno_id,
      instrutor_id: registro.instrutor_id,
    });

    return res.status(401).json({ erro: 'Refresh token inválido' });
  }

  if (registro.expira_em < new Date()) {
    return res.status(401).json({ erro: 'Refresh token expirado' });
  }

  let dono;

  if (registro.aluno_id) {
    const aluno = await alunosRepository.buscarPorId(registro.aluno_id);
    dono = aluno && { id: aluno.id, papel: 'aluno' };
  } else {
    const instrutor = await instrutoresRepository.buscarPorId(
      registro.instrutor_id,
    );

    dono = instrutor && { id: instrutor.id, papel: instrutor.papel };
  }

  if (!dono) {
    return res.status(401).json({ erro: 'Refresh token inválido' });
  }

  await refreshTokensRepository.revogar(registro.id);

  const tokens = await emitirTokens(dono);
  responderComTokens(res, tokens);
});

router.post('/logout', async (req, res) => {
  const refresh_token = req.cookies[COOKIE_REFRESH];

  if (refresh_token) {
    const registro = await refreshTokensRepository.buscarPorHash(
      hashRefreshToken(refresh_token),
    );

    if (registro) {
      await refreshTokensRepository.revogar(registro.id);
    }
  }

  res.clearCookie(COOKIE_REFRESH, { path: '/auth' });
  res.status(204).send();
});

module.exports = router;
