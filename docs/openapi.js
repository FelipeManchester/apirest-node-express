const componentes = require('./componentes');

const auth = require('./paths/auth');
const alunos = require('./paths/alunos');
const aulas = require('./paths/aulas');
const instrutores = require('./paths/instrutores');

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Studio Fit API',
    version: '1.0.0',
    description: 'API de agendamento de aulas de uma academia.',
  },
  servers: [
    {
      url: process.env.PUBLIC_URL || 'http://localhost:3000',
      description: process.env.PUBLIC_URL ? 'Produção' : 'Desenvolvimento',
    },
  ],
  tags: [
    { name: 'Autenticação' },
    { name: 'Alunos' },
    { name: 'Instrutores' },
    { name: 'Aulas' },
    { name: 'Matrículas' },
  ],
  components: componentes,
  paths: { ...auth, ...alunos, ...aulas, ...instrutores },
};
