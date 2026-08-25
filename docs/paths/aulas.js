const { listarAulasQuerySchema } = require('../../schemas');
const {
  parametrosDeQuery,
  corpo,
  json,
  lista,
  paginado,
  erro,
  semConteudo,
  idNoCaminho,
} = require('../helpers');

const gestaoDaAula = [{ bearerAuth: [] }];

module.exports = {
  '/aulas': {
    get: {
      tags: ['Aulas'],
      summary: 'Lista aulas',
      description: 'Rota pública. Paginada, com filtro por instrutor e dia.',
      parameters: parametrosDeQuery(listarAulasQuerySchema),
      responses: {
        200: paginado('Aula', 'Página de aulas'),
        400: erro('Parâmetro de query inválido'),
      },
    },
    post: {
      tags: ['Aulas'],
      summary: 'Cria uma aula',
      description:
        'Instrutor só cria aula para si mesmo; admin cria para qualquer um.',
      security: gestaoDaAula,
      requestBody: corpo('CriarAula'),
      responses: {
        201: json('Aula', 'Aula criada'),
        400: erro('Corpo inválido'),
        401: erro('Token ausente ou inválido'),
        403: erro('Instrutor tentando criar aula para outro instrutor'),
        422: erro('Instrutor inexistente ou conflito de agenda (Regra 3)'),
      },
    },
  },

  '/aulas/{id}': {
    get: {
      tags: ['Aulas'],
      summary: 'Busca uma aula',
      parameters: [idNoCaminho('id', 'ID da aula')],
      responses: {
        200: json('Aula', 'Aula encontrada'),
        400: erro('ID inválido'),
        404: erro('Aula não encontrada'),
      },
    },
    patch: {
      tags: ['Aulas'],
      summary: 'Atualiza uma aula',
      security: gestaoDaAula,
      parameters: [idNoCaminho('id', 'ID da aula')],
      requestBody: corpo('AtualizarAula'),
      responses: {
        200: json('Aula', 'Aula atualizada'),
        400: erro('Corpo ou ID inválido'),
        401: erro('Token ausente ou inválido'),
        403: erro('Aula de outro instrutor'),
        404: erro('Aula não encontrada'),
        422: erro('Conflito de agenda (Regra 3)'),
      },
    },
    delete: {
      tags: ['Aulas'],
      summary: 'Remove uma aula',
      security: gestaoDaAula,
      parameters: [idNoCaminho('id', 'ID da aula')],
      responses: {
        204: semConteudo('Aula removida'),
        401: erro('Token ausente ou inválido'),
        403: erro('Aula de outro instrutor'),
        404: erro('Aula não encontrada'),
      },
    },
  },

  '/aulas/{id}/matriculas': {
    get: {
      tags: ['Matrículas'],
      summary: 'Lista as matrículas de uma aula',
      description: 'Somente o instrutor da aula ou admin.',
      security: gestaoDaAula,
      parameters: [idNoCaminho('id', 'ID da aula')],
      responses: {
        200: lista('MatriculaDaAula', 'Matrículas da aula'),
        401: erro('Token ausente ou inválido'),
        403: erro('Aula de outro instrutor'),
        404: erro('Aula não encontrada'),
      },
    },
    post: {
      tags: ['Matrículas'],
      summary: 'Matricula o aluno autenticado na aula',
      description:
        'O aluno vem do token — não há aluno_id no corpo. ' +
        'Roda em transação com SELECT ... FOR UPDATE (parte 13).',
      security: [{ bearerAuth: [] }],
      parameters: [idNoCaminho('id', 'ID da aula')],
      responses: {
        201: json('Matricula', 'Matrícula criada'),
        401: erro('Token ausente ou inválido'),
        403: erro('Somente aluno pode se matricular'),
        404: erro('Aula não encontrada'),
        409: erro('Aula sem vagas (Regra 1) ou aluno já matriculado (Regra 2)'),
      },
    },
  },

  '/aulas/{id}/matriculas/{matriculaId}': {
    patch: {
      tags: ['Matrículas'],
      summary: 'Cancela uma matrícula',
      description:
        'Cancelamento é mudança de status, nunca DELETE (Regra 4).',
      security: [{ bearerAuth: [] }],
      parameters: [
        idNoCaminho('id', 'ID da aula'),
        idNoCaminho('matriculaId', 'ID da matrícula'),
      ],
      requestBody: corpo('CancelarMatricula'),
      responses: {
        200: json('Matricula', 'Matrícula cancelada'),
        400: erro('Corpo ou ID inválido'),
        401: erro('Token ausente ou inválido'),
        403: erro('Matrícula de outro aluno'),
        404: erro('Matrícula não encontrada'),
      },
    },
  },
};
