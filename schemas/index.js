const { z } = require('zod');
const { criarAlunoSchema } = require('./alunoSchema');
const {
  criarInstrutorSchema,
  atualizarInstrutorSchema,
} = require('./instrutorSchema');
const { criarAulaSchema, atualizarAulaSchema } = require('./aulasSchema');
const { paginacaoSchema } = require('./paginacaoSchema');
const {
  idParamSchema,
  idsMatriculaParamSchema,
  listarAulasQuerySchema,
  cancelarMatriculaSchema,
} = require('./comumSchema');

// Mensagens de erro em pt-BR, para todos os schemas do projeto.

z.config(z.locales.pt());

module.exports = {
  paginacaoSchema,
  criarAlunoSchema,
  criarInstrutorSchema,
  atualizarInstrutorSchema,
  criarAulaSchema,
  atualizarAulaSchema,
  idParamSchema,
  idsMatriculaParamSchema,
  listarAulasQuerySchema,
  cancelarMatriculaSchema,
};
