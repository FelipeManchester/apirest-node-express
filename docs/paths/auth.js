const { corpo, json, erro, semConteudo } = require('../helpers');

const login = (quem) => ({
  tags: ['Autenticação'],
  summary: `Login de ${quem}`,
  description:
    'Devolve o access token no corpo e o refresh token num cookie httpOnly.',
  requestBody: corpo('Login'),
  responses: {
    200: json('AccessToken', 'Autenticado'),
    400: erro('email ou senha ausentes'),
    401: erro('Credenciais inválidas'),
    429: erro('Tentativas demais — rate limit do login'),
  },
});

module.exports = {
  '/auth/login': { post: login('aluno') },
  '/auth/instrutores/login': { post: login('instrutor') },

  '/auth/refresh': {
    post: {
      tags: ['Autenticação'],
      summary: 'Renova o access token',
      description:
        'Lê o refresh token do cookie, rotaciona e devolve um novo par. ' +
        'Não recebe corpo.',
      responses: {
        200: json('AccessToken', 'Token renovado'),
        401: erro('Refresh token ausente, inválido, expirado ou reusado'),
      },
    },
  },

  '/auth/logout': {
    post: {
      tags: ['Autenticação'],
      summary: 'Revoga o refresh token e limpa o cookie',
      responses: {
        204: semConteudo('Sessão encerrada'),
      },
    },
  },
};
