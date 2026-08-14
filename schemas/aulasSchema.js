const { default: z } = require('zod');

const DIAS = [
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado',
  'domingo',
];

const criarAulaSchema = z.strictObject({
  nome: z.string().trim().min(2).max(120),
  instrutor_id: z.coerce.number().int().positive(),
  dia_semana: z.enum(DIAS),
  hora_inicio: z.iso.time(),
  duracao_minutos: z.coerce.number().int().positive().max(480),
  capacidade_maxima: z.coerce.number().int().positive().max(200),
});

const atualizarAulaSchema = criarAulaSchema
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, {
    message: 'Envie ao menos um campo para atualizar',
  });

module.exports = { criarAulaSchema, atualizarAulaSchema, DIAS };
