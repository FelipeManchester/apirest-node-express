const { default: z } = require('zod');

const criarAlunoSchema = z.strictObject({
  nome: z.string().trim().min(2).max(120),
  email: z.email().max(160),
  data_nascimento: z.iso.date(),
  senha: z.string().min(8).max(72),
});

module.exports = { criarAlunoSchema };
