const express = require('express');
const { z } = require('zod');
const instrutoresRepository = require('../repositories/instrutoresRepository');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');
const { hashSenha } = require('../services/senhaService');

const validar = require('../middlewares/validar');

const {
  criarInstrutorSchema,
  atualizarInstrutorSchema,
  idParamSchema,
  paginacaoSchema,
} = require('../schemas');

const listarInstrutoresQuerySchema = paginacaoSchema([
  'id',
  'nome',
  'especialidade',
]).extend({
  nome: z.string().trim().min(1).optional(),
  especialidade: z.string().trim().min(1).optional(),
});

const router = express.Router();

// LISTA TODOS OS INSTRUTORES
router.get(
  '/',
  validar({ query: listarInstrutoresQuerySchema }),
  async (req, res) => {
    const { pagina, limite } = req.query;

    const { dados, total } = await instrutoresRepository.listar(req.query);

    res.json({
      dados,
      paginacao: {
        pagina,
        limite,
        total,
        total_paginas: Math.ceil(total / limite),
      },
    });
  },
);

// LISTA UM INSTRUTOR POR ID
router.get('/:id', validar({ params: idParamSchema }), async (req, res) => {
  const instrutor = await instrutoresRepository.buscarPorId(req.params.id);

  if (!instrutor) {
    return res.status(404).json({ erro: 'Instrutor não encontrado' });
  }

  res.json(instrutor);
});

// CRIAR UM INSTRUTOR
router.post(
  '/',
  autenticar,
  autorizar('admin'),
  validar({ body: criarInstrutorSchema }),
  async (req, res) => {
    const { nome, especialidade, email, senha, papel } = req.body;

    if (!nome || !especialidade) {
      return res
        .status(400)
        .json({ erro: 'nome e especialidade são orbigatórios' });
    }

    const senha_hash = senha ? await hashSenha(senha) : null;

    const instrutorCriado = await instrutoresRepository.criar({
      nome,
      especialidade,
      email,
      senha_hash,
      papel,
    });

    res
      .status(201)
      .location(`/instrutores/${instrutorCriado.id}`)
      .json(instrutorCriado);
  },
);

// EDITAR UM INSTRUTOR

router.patch(
  '/:id',
  autenticar,
  autorizar('admin'),
  validar({ params: idParamSchema, body: atualizarInstrutorSchema }),
  async (req, res) => {
    const { nome, especialidade, ativo } = req.body;

    const instrutorAtualizado = await instrutoresRepository.atualizar(
      req.params.id,
      {
        nome: nome ?? null,
        especialidade: especialidade ?? null,
        ativo: ativo ?? null,
      },
    );

    if (!instrutorAtualizado) {
      return res.status(404).json({ erro: 'Instrutor não encontrado' });
    }

    res.json(instrutorAtualizado);
  },
);

// DELETAR INSTRUTOR

router.delete(
  '/:id',
  autenticar,
  autorizar('admin'),
  validar({ params: idParamSchema }),
  async (req, res) => {
    const instrutorRemovido = await instrutoresRepository.remover(
      req.params.id,
    );

    if (!instrutorRemovido) {
      return res.status(404).json({ erro: 'Instrutor não encontrado' });
    }

    res.status(204).send();
  },
);

module.exports = router;
