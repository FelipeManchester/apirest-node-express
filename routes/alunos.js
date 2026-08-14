const express = require('express');

const { hashSenha } = require('../services/senhaService');

const alunosRepository = require('../repositories/alunosRepository');
const matriculasRepository = require('../repositories/matriculasRepository');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');

const validar = require('../middlewares/validar');
const { criarAlunoSchema, idParamSchema } = require('../schemas');

const router = express.Router();

router.get('/', autenticar, autorizar('admin'), async (req, res) => {
  const alunos = await alunosRepository.listar();

  res.json(alunos);
});

router.post('/', validar({ body: criarAlunoSchema }), async (req, res) => {
  const { nome, email, data_nascimento, senha } = req.body;

  const senha_hash = await hashSenha(senha);

  const alunoCriado = await alunosRepository.criar({
    nome,
    email,
    data_nascimento,
    senha_hash,
  });
  const { senha_hash: _senhaHash, ...alunoSemSenha } = alunoCriado;
  res.status(201).location(`/alunos/${alunoCriado.id}`).json(alunoSemSenha);
});

router.get(
  '/:id/matriculas',
  autenticar,
  validar({ params: idParamSchema }),
  async (req, res) => {
    if (
      req.usuario.papel !== 'aluno' ||
      Number(req.params.id) !== req.usuario.id
    ) {
      return res.status(403).json({
        erro: 'Você não pode ver as matrículas de outro aluno',
      });
    }

    const aluno = await alunosRepository.buscarPorId(req.params.id);

    if (!aluno) {
      return res.status(404).json({ erro: 'Aluno não encontrado' });
    }

    const matriculas = await matriculasRepository.listarPorAluno(req.params.id);
    res.json(matriculas);
  },
);

module.exports = router;
