const { listarAlunosQuerySchema } = require('../../schemas');
const {
  parametrosDeQuery,
  corpo,
  json,
  lista,
  paginado,
  erro,
  idNoCaminho,
} = require('../helpers');

module.exports = {
  '/alunos': {
    get: {
      tags: ['Alunos'],
      summary: 'Lista alunos',
      description: 'Somente admin. Paginado, com filtro por nome.',
      security: [{ bearerAuth: [] }],
      parameters: parametrosDeQuery(listarAlunosQuerySchema),
      responses: {
        200: paginado('Aluno', 'Página de alunos'),
        400: erro('Parâmetro de query inválido'),
        401: erro('Token ausente ou inválido'),
        403: erro('Papel sem permissão'),
      },
    },
    post: {
      tags: ['Alunos'],
      summary: 'Cadastra um aluno',
      description: 'Rota pública: é o cadastro do próprio aluno.',
      requestBody: corpo('CriarAluno'),
      responses: {
        201: json('Aluno', 'Aluno criado (header Location aponta para ele)'),
        400: erro('Corpo inválido'),
        409: erro('Já existe um aluno com esse email'),
      },
    },
  },

  '/alunos/{id}/matriculas': {
    get: {
      tags: ['Alunos'],
      summary: 'Lista as matrículas de um aluno',
      description: 'Cada aluno só enxerga as próprias matrículas.',
      security: [{ bearerAuth: [] }],
      parameters: [idNoCaminho('id', 'ID do aluno')],
      responses: {
        200: lista('MatriculaDoAluno', 'Matrículas do aluno'),
        401: erro('Token ausente ou inválido'),
        403: erro('Tentativa de ver matrículas de outro aluno'),
        404: erro('Aluno não encontrado'),
      },
    },
  },
};
