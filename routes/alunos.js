const express = require('express');

const alunosRepository = require('../repositories/alunosRepository');
const matriculasRepository = require('../repositories/matriculasRepository');

const router = express.Router();

router.get('/', async (req, res) => {
  const alunos = await alunosRepository.listar();

  res.json(alunos);
});

router.post('/', async (req, res) => {
  const { nome, email, data_nascimento } = req.body;

  if (!nome || !email || !data_nascimento) {
    return res.status(400).json({
      erro: 'nome, email e data_nascimento são obrigatórios',
    });
  }

  const alunoCriado = await alunosRepository.criar({
    nome,
    email,
    data_nascimento,
  });
  res.status(201).location(`/alunos/${alunoCriado.id}`).json(alunoCriado);
});

router.get('/:id/matriculas', async (req, res) => {
  const aluno = await alunosRepository.buscarPorId(req.params.id);

  if (!aluno) {
    return res.status(404).json({ erro: 'Aluno não encontrado' });
  }

  const matriculas = await matriculasRepository.listarPorAluno(req.params.id);
  res.json(matriculas);
});

module.exports = router;
