const express = require('express');

const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi');

const alunosRouter = require('./routes/alunos');
const instrutoresRouter = require('./routes/instrutores');
const aulasRouter = require('./routes/aulas');
const authRouter = require('./routes/auth');

const cookieParser = require('cookie-parser');
const ErroDeDominio = require('./errors/ErroDeDominio');
const helmet = require('helmet');
const corsConfigurado = require('./middlewares/cors');
const {
  limitadorLogin,
  limitadorGlobal,
} = require('./middlewares/limitadores');

const app = express();

app.use(helmet());
app.use(corsConfigurado);
app.use(limitadorGlobal);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/docs.json', (req, res) => res.json(openapi));
app.use(
  '/docs',
  helmet({ contentSecurityPolicy: false }),
  swaggerUi.serve,
  swaggerUi.setup(openapi),
);

app.use('/alunos', alunosRouter);
app.use('/instrutores', instrutoresRouter);
app.use('/aulas', aulasRouter);
app.use('/auth', limitadorLogin, authRouter);

app.use((err, req, res, _next) => {
  if (err instanceof ErroDeDominio) {
    return res.status(err.status).json({ erro: err.message });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'Corpo da requisição grande demais' });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido' });
  }

  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor' });
});

module.exports = app;
