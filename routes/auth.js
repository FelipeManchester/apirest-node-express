const express = require('express');
const jwt = require('jsonwebtoken');

const { compararSenha } = require('../services/senhaService');
const alunosRepository = require('../repositories/alunosRepository');

const router = express.Router();

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

  const token = jwt.sign({ aluno_id: aluno.id }, process.env.JWT_SECRET, {
    expiresIn: '2h',
  });

  res.json({ token });
});

module.exports = router;
