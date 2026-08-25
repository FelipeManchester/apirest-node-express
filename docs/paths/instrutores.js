const { listarInstrutoresQuerySchema } = require('../../schemas');
const {
  parametrosDeQuery,
  corpo,
  json,
  paginado,
  erro,
  semConteudo,
  idNoCaminho,
} = require('../helpers');

const somenteAdmin = [{ bearerAuth: [] }];

module.exports = {
  '/instrutores': {
    get: {
      tags: ['Instrutores'],
      summary: 'Lista instrutores ativos',
      description: 'Rota pública. Paginada, com filtro por nome e especialidade.',
      parameters: parametrosDeQuery(listarInstrutoresQuerySchema),
      responses: {
        200: paginado('InstrutorResumo', 'Página de instrutores'),
        400: erro('Parâmetro de query inválido'),
      },
    },
    post: {
      tags: ['Instrutores'],
      summary: 'Cadastra um instrutor',
      description: 'Somente admin — instrutor não se autocadastra.',
      security: somenteAdmin,
      requestBody: corpo('CriarInstrutor'),
      responses: {
        201: json('Instrutor', 'Instrutor criado'),
        400: erro('Corpo inválido'),
        401: erro('Token ausente ou inválido'),
        403: erro('Papel sem permissão'),
      },
    },
  },

  '/instrutores/{id}': {
    get: {
      tags: ['Instrutores'],
      summary: 'Busca um instrutor',
      description: 'Rota pública: devolve só os dados de vitrine.',
      parameters: [idNoCaminho('id', 'ID do instrutor')],
      responses: {
        200: json('InstrutorPublico', 'Instrutor encontrado'),
        400: erro('ID inválido'),
        404: erro('Instrutor não encontrado'),
      },
    },
    patch: {
      tags: ['Instrutores'],
      summary: 'Atualiza um instrutor',
      security: somenteAdmin,
      parameters: [idNoCaminho('id', 'ID do instrutor')],
      requestBody: corpo('AtualizarInstrutor'),
      responses: {
        200: json('Instrutor', 'Instrutor atualizado'),
        400: erro('Corpo ou ID inválido'),
        401: erro('Token ausente ou inválido'),
        403: erro('Papel sem permissão'),
        404: erro('Instrutor não encontrado'),
      },
    },
    delete: {
      tags: ['Instrutores'],
      summary: 'Desativa um instrutor (soft-delete da parte 15)',
      security: somenteAdmin,
      parameters: [idNoCaminho('id', 'ID do instrutor')],
      responses: {
        204: semConteudo('Instrutor desativado'),
        401: erro('Token ausente ou inválido'),
        403: erro('Papel sem permissão'),
        404: erro('Instrutor não encontrado'),
      },
    },
  },
};
