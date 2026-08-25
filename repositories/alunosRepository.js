const pool = require('../db/pool');

// LISTAR OS ALUNOS

const COLUNAS_ORDENAVEIS = {
  id: 'id',
  nome: 'nome',
  criado_em: 'criado_em',
};

async function listar({
  pagina = 1,
  limite = 20,
  ordenar_por = 'id',
  ordem = 'asc',
  nome,
} = {}) {
  const coluna = COLUNAS_ORDENAVEIS[ordenar_por] ?? 'id';
  const direcao = ordem === 'desc' ? 'DESC' : 'ASC';

  const valores = [];
  let where = '';

  if (nome) {
    valores.push(nome);
    where = `WHERE nome ILIKE '%' || $${valores.length} || '%'`;
  }

  valores.push(limite, (pagina - 1) * limite);

  const query = /* sql */ `
    SELECT id, nome, email, data_nascimento, criado_em,
           COUNT(*) OVER() AS total
    FROM alunos
    ${where}
    ORDER BY ${coluna} ${direcao}
    LIMIT $${valores.length - 1} OFFSET $${valores.length}
  `;

  const resultado = await pool.query(query, valores);

  const total = resultado.rows.length ? Number(resultado.rows[0].total) : 0;

  return {
    dados: resultado.rows.map(({ total: _total, ...aluno }) => aluno),
    total,
  };
}

// CRIAR OS ALUNOS
async function criar({ nome, email, data_nascimento, senha_hash }) {
  const query =
    'INSERT INTO alunos (nome, email, data_nascimento, senha_hash) VALUES ($1, $2, $3, $4) RETURNING *';
  const resultado = await pool.query(query, [
    nome,
    email,
    data_nascimento,
    senha_hash,
  ]);

  return resultado.rows[0];
}

// BUSCAR ALUNO POR ID

async function buscarPorId(id) {
  const query = 'SELECT * FROM alunos WHERE id = $1';

  const resultado = await pool.query(query, [id]);

  return resultado.rows[0];
}

async function buscarPorEmail(email) {
  const query = 'SELECT * FROM alunos WHERE email = $1';

  const resultado = await pool.query(query, [email]);

  return resultado.rows[0];
}

module.exports = { listar, criar, buscarPorId, buscarPorEmail };
