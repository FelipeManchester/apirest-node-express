require('dotenv').config();

const express = require('express');

const alunosRouter = require('./routes/alunos');
const instrutoresRouter = require('./routes/instrutores');
const aulasRouter = require('./routes/aulas');

const app = express();

app.use(express.json());

app.use('/alunos', alunosRouter);
app.use('/instrutores', instrutoresRouter);
app.use('/aulas', aulasRouter);

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno no servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
