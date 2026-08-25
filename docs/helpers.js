const { z } = require('zod');

function paraJsonSchema(schema) {
  return z.toJSONSchema(schema, { io: 'input', target: 'openapi-3.0' });
}

function parametrosDeQuery(schema) {
  const jsonSchema = paraJsonSchema(schema);
  const obrigatorios = jsonSchema.required ?? [];

  return Object.entries(jsonSchema.properties).map(([nome, definicao]) => ({
    name: nome,
    in: 'query',
    required: obrigatorios.includes(nome),
    schema: definicao,
  }));
}

const referencia = (nome) => ({ $ref: `#/components/schemas/${nome}` });

const corpo = (nome) => ({
  required: true,
  content: { 'application/json': { schema: referencia(nome) } },
});

const json = (nome, description) => ({
  description,
  content: { 'application/json': { schema: referencia(nome) } },
});

const lista = (nome, description) => ({
  description,
  content: {
    'application/json': {
      schema: { type: 'array', items: referencia(nome) },
    },
  },
});

const paginado = (nome, description) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          dados: { type: 'array', items: referencia(nome) },
          paginacao: referencia('Paginacao'),
        },
      },
    },
  },
});

const erro = (description) => json('Erro', description);

const semConteudo = (description) => ({ description });

const idNoCaminho = (nome = 'id', description = 'Identificador do recurso') => ({
  name: nome,
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', minimum: 1 },
});

module.exports = {
  paraJsonSchema,
  parametrosDeQuery,
  referencia,
  corpo,
  json,
  lista,
  paginado,
  erro,
  semConteudo,
  idNoCaminho,
};
