const express = require('express');
const instrutoresRepository = require('../repositories/instrutoresRepository');

const router = express.Router();

// LISTA TODOS OS INSTRUTORES
router.get('/', async (req, res) => {
  const instrutores = await instrutoresRepository.listar();
  res.json(instrutores);
});

// LISTA UM INSTRUTOR POR ID
router.get('/:id', async (req, res) => {
  const instrutor = await instrutoresRepository.buscarPorId(req.params.id);

  if (!instrutor) {
    return res.status(404).json({ erro: 'Instrutor não encontrado' });
  }

  res.json(instrutor);
});

// CRIAR UM INSTRUTOR
router.post('/', async (req, res) => {
  const { nome, especialidade } = req.body;

  if (!nome || !especialidade) {
    return res
      .status(400)
      .json({ erro: 'nome e especialidade são orbigatórios' });
  }

  const instrutorCriado = await instrutoresRepository.criar({
    nome,
    especialidade,
  });

  res
    .status(201)
    .location(`/instrutores/${instrutorCriado.id}`)
    .json(instrutorCriado);
});

// EDITAR UM INSTRUTOR

router.patch('/:id', async (req, res) => {
  const { nome, especialidade } = req.body;

  const instrutorAtualizado = await instrutoresRepository.atualizar(
    req.params.id,
    {
      nome: nome ?? null,
      especialidade: especialidade ?? null,
    },
  );

  if (!instrutorAtualizado) {
    return res.status(404).json({ erro: 'Instrutor não encontrado' });
  }

  res.json(instrutorAtualizado);
});

// DELETAR INSTRUTOR

router.delete('/:id', async (req, res, next) => {
  try {
    const instrutorRemovido = await instrutoresRepository.remover(
      req.params.id,
    );

    if (!instrutorRemovido) {
      return res.status(404).json({ erro: 'Instrutor não encontrado' });
    }

    res.status(204).send();
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({
        erro: 'Não é possível remover: Existem aulas cadastradas com este instrutor',
      });
    }
    next(err);
  }
});

module.exports = router;
