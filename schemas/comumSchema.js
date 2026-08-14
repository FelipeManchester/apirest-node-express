const { default: z } = require('zod');

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const idsMatriculaParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  matriculaId: z.coerce.number().int().positive(),
});

const listarAulasQuerySchema = z.object({
  instrutor_id: z.coerce.number().int().positive().optional(),
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
