const { default: z } = require('zod');
const { paginacaoSchema } = require('./paginacaoSchema');
const { DIAS } = require('./aulasSchema');

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const idsMatriculaParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  matriculaId: z.coerce.number().int().positive(),
});

const listarAulasQuerySchema = paginacaoSchema([
  'id',
  'nome',
  'hora_inicio',
]).extend({
  instrutor_id: z.coerce.number().int().positive().optional(),
  dia_semana: z.enum(DIAS).optional(),
});

const cancelarMatriculaSchema = z.strictObject({
  status: z.literal('cancelada'),
});

module.exports = {
  idParamSchema,
  idsMatriculaParamSchema,
  listarAulasQuerySchema,
  cancelarMatriculaSchema,
};
