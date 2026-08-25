const {
  criarAlunoSchema,
  criarInstrutorSchema,
  atualizarInstrutorSchema,
  criarAulaSchema,
  atualizarAulaSchema,
  cancelarMatriculaSchema,
} = require('../schemas');
const { paraJsonSchema } = require('./helpers');

const id = { type: 'integer', example: 1 };
const dataHora = { type: 'string', format: 'date-time' };

module.exports = {
  securitySchemes: {
    bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
  },

  schemas: {
    // Entrada: derivada dos schemas Zod.
    CriarAluno: paraJsonSchema(criarAlunoSchema),
    CriarInstrutor: paraJsonSchema(criarInstrutorSchema),
    AtualizarInstrutor: {
      ...paraJsonSchema(atualizarInstrutorSchema),
      description: 'Envie ao menos um campo.',
    },
    CriarAula: paraJsonSchema(criarAulaSchema),
    AtualizarAula: {
      ...paraJsonSchema(atualizarAulaSchema),
      description: 'Envie ao menos um campo.',
    },
    CancelarMatricula: paraJsonSchema(cancelarMatriculaSchema),
    Login: {
      type: 'object',
      required: ['email', 'senha'],
      properties: {
        email: { type: 'string', format: 'email' },
        senha: { type: 'string' },
      },
    },

    // Saída: escrita à mão — não existe schema Zod do que a API devolve.
    AccessToken: {
      type: 'object',
      properties: { access_token: { type: 'string' } },
    },
    Aluno: {
      type: 'object',
      properties: {
        id,
        nome: { type: 'string' },
        email: { type: 'string', format: 'email' },
        data_nascimento: { type: 'string', format: 'date' },
        criado_em: dataHora,
      },
    },
    Instrutor: {
      type: 'object',
      properties: {
        id,
        nome: { type: 'string' },
        especialidade: { type: 'string' },
        email: { type: 'string', format: 'email' },
        papel: { type: 'string', enum: ['instrutor', 'admin'] },
        ativo: { type: 'boolean' },
      },
    },
    // O detalhe público é o mais enxuto: nem email, nem papel, nem ativo.
    InstrutorPublico: {
      type: 'object',
      properties: {
        id,
        nome: { type: 'string' },
        especialidade: { type: 'string' },
      },
    },
    // A listagem devolve papel a mais; o schema completo só sai para admin.
    InstrutorResumo: {
      type: 'object',
      properties: {
        id,
        nome: { type: 'string' },
        especialidade: { type: 'string' },
        papel: { type: 'string', enum: ['instrutor', 'admin'] },
      },
    },
    Aula: {
      type: 'object',
      properties: {
        id,
        nome: { type: 'string' },
        instrutor_id: id,
        dia_semana: { type: 'string' },
        hora_inicio: { type: 'string', example: '07:00:00' },
        duracao_minutos: { type: 'integer' },
        capacidade_maxima: { type: 'integer' },
      },
    },
    Matricula: {
      type: 'object',
      properties: {
        id,
        aluno_id: id,
        aula_id: id,
        status: { type: 'string', enum: ['confirmada', 'cancelada'] },
        criado_em: dataHora,
      },
    },
    MatriculaDoAluno: {
      type: 'object',
      properties: {
        id,
        status: { type: 'string', enum: ['confirmada', 'cancelada'] },
        criado_em: dataHora,
        aula_id: id,
        aula_nome: { type: 'string' },
        dia_semana: { type: 'string' },
        hora_inicio: { type: 'string' },
      },
    },
    MatriculaDaAula: {
      type: 'object',
      properties: {
        id,
        status: { type: 'string', enum: ['confirmada', 'cancelada'] },
        criado_em: dataHora,
        aluno_id: id,
        aluno_nome: { type: 'string' },
        aluno_email: { type: 'string', format: 'email' },
      },
    },
    Paginacao: {
      type: 'object',
      properties: {
        pagina: { type: 'integer' },
        limite: { type: 'integer' },
        total: { type: 'integer' },
        total_paginas: { type: 'integer' },
      },
    },
    Erro: {
      type: 'object',
      properties: {
        erro: { type: 'string' },
        detalhes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              campo: { type: 'string' },
              mensagem: { type: 'string' },
            },
          },
        },
      },
    },
  },
};
