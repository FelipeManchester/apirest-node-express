const { z } = require('zod');

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 100;

function paginacaoSchema(colunasOrdenaveis) {
  return z.object({
    pagina: z.coerce.number().int().positive().default(1),
    limite: z.coerce
      .number()
      .int()
      .positive()
      .max(LIMITE_MAXIMO)
      .default(LIMITE_PADRAO),
    ordenar_por: z.enum(colunasOrdenaveis).default(colunasOrdenaveis[0]),
    ordem: z.enum(['asc', 'desc']).default('asc'),
  });
}

module.exports = { paginacaoSchema, LIMITE_PADRAO, LIMITE_MAXIMO };
