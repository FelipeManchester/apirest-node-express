const pool = require('../db/pool');

const COLUNAS_ORDENAVEIS = {
  id: 'id',
  nome: 'nome',
  especialidade: 'especialidade',
};

async function listar({
  pagina = 1,
  limite = 20,
  ordenar_por = 'id',
  ordem = 'asc',
  nome,
  especialidade,
} = {}) {
  const coluna = COLUNAS_ORDENAVEIS[ordenar_por] ?? 'id';
  const direcao = ordem === 'desc' ? 'DESC' : 'ASC';

  const condicoes = ['ativo = true'];
  const valores = [];

  if (nome) {
    valores.push(nome);
    condicoes.push(`nome ILIKE '%' || $${valores.length} || '%'`);
  }

  if (especialidade) {
    valores.push(especialidade);
    condicoes.push(`especialidade ILIKE '%' || $${valores.length} || '%'`);
  }

  valores.push(limite, (pagina - 1) * limite);

  const query = /* sql */ `
    SELECT id, nome, especialidade, papel,
           COUNT(*) OVER() AS total
    FROM instrutores
    WHERE ${condicoes.join(' AND ')}
    ORDER BY ${coluna} ${direcao}
    LIMIT $${valores.length - 1} OFFSET $${valores.length}
  `;

  const resultado = await pool.query(query, valores);

  const total = resultado.rows.length ? Number(resultado.rows[0].total) : 0;

  return {
    dados: resultado.rows.map(({ total: _total, ...instrutor }) => instrutor),
    total,
  };
}

async function buscarPorId(id) {
  const query = 'SELECT * FROM instrutores WHERE id = $1';
  const resultado = await pool.query(query, [id]);

  return resultado.rows[0];
}

async function criar({ nome, especialidade, email, senha_hash, papel }) {
  const query = /* sql */ `
    INSERT INTO instrutores (nome, especialidade, email, senha_hash, papel)
    VALUES ($1, $2, $3, $4, COALESCE($5, 'instrutor'))
    RETURNING id, nome, especialidade, email, papel
  `;
  const resultado = await pool.query(query, [
    nome,
    especialidade,
    email ?? null,
    senha_hash ?? null,
    papel ?? null,
  ]);

  return resultado.rows[0];
}

async function atualizar(id, { nome, especialidade, ativo }) {
  const query = /* sql */ `
    UPDATE instrutores
    SET nome = COALESCE($1, nome),
        especialidade = COALESCE($2, especialidade),
        ativo = COALESCE($3, ativo)
    WHERE id = $4
    RETURNING id, nome, especialidade, email, papel, ativo
  `;

  const resultado = await pool.query(query, [
    nome,
    especialidade,
    ativo ?? null,
    id,
  ]);

  return resultado.rows[0];
}

async function remover(id) {
  const query = /* sql */ `
    UPDATE instrutores
    SET ativo = false
    WHERE id = $1
    RETURNING id, nome, especialidade, email, papel, ativo
  `;
  const resultado = await pool.query(query, [id]);

  return resultado.rows[0];
}

async function buscarPorEmail(email) {
  const query = 'SELECT * FROM instrutores WHERE email = $1 AND ativo = true';
  const resultado = await pool.query(query, [email]);

  return resultado.rows[0];
}

module.exports = {
  listar,
  buscarPorId,
  buscarPorEmail,
  criar,
  atualizar,
  remover,
};
