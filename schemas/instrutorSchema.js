const { default: z } = require('zod');

const criarInstrutorSchema = z.strictObject({
  nome: z.string().trim().min(2).max(120),
  especialidade: z.string().trim().min(2).max(80),
  email: z.email().max(160).optional(),
  senha: z.string().min(8).max(72).optional(),
  papel: z.enum(['instrutor', 'admin']).optional(),
  ativo: z.boolean().optional(),
});

const atualizarInstrutorSchema = criarInstrutorSchema
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, {
    message: 'Envie ao menos um campo para atualizar',
  });

module.exports = { criarInstrutorSchema, atualizarInstrutorSchema };
