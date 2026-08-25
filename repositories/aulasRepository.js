const pool = require('../db/pool');

// LISTAR AULAS DE UM INSTRUTOR OU TODAS

const COLUNAS_ORDENAVEIS = {
  id: 'id',
  nome: 'nome',
  hora_inicio: 'hora_inicio',
};

async function listar({
  pagina = 1,
  limite = 20,
  ordenar_por = 'id',
  ordem = 'asc',
  instrutor_id,
  dia_semana,
} = {}) {
  const coluna = COLUNAS_ORDENAVEIS[ordenar_por] ?? 'id';
  const direcao = ordem === 'desc' ? 'DESC' : 'ASC';

  const condicoes = [];
  const valores = [];

  if (instrutor_id) {
    valores.push(instrutor_id);
    condicoes.push(`instrutor_id = $${valores.length}`);
  }

  if (dia_semana) {
    valores.push(dia_semana);
    condicoes.push(`dia_semana = $${valores.length}`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  valores.push(limite, (pagina - 1) * limite);

  const query = /* sql */ `
    SELECT *, COUNT(*) OVER() AS total
    FROM aulas
    ${where}
    ORDER BY ${coluna} ${direcao}
    LIMIT $${valores.length - 1} OFFSET $${valores.length}
  `;

  const resultado = await pool.query(query, valores);

  const total = resultado.rows.length ? Number(resultado.rows[0].total) : 0;

  return {
    dados: resultado.rows.map(({ total: _total, ...aula }) => aula),
    total,
  };
}

async function buscarPorId(id) {
  const query = 'SELECT * FROM aulas WHERE id = $1';

  const resultado = await pool.query(query, [id]);
  return resultado.rows[0];
}

// Igual a buscarPorId, mas trava a linha até o fim da transação.
// Só faz sentido dentro de executarEmTransacao — por isso o executor
// é obrigatório aqui, sem valor padrão.
async function buscarPorIdBloqueando(id, executor) {
  const query = 'SELECT * FROM aulas WHERE id = $1 FOR UPDATE';

  const resultado = await executor.query(query, [id]);
  return resultado.rows[0];
}

// VERIFICA CONFLITO DE AGENDAS

async function existeConflito({
  instrutor_id,
  dia_semana,
  hora_inicio,
  duracao_minutos,
  ignorarId = null,
}) {
  const query = /* sql */ `
  SELECT EXISTS (
    SELECT 1 FROM AULAS
    WHERE instrutor_id = $1
      AND dia_semana = $2
      AND id IS DISTINCT FROM $5
      AND (hora_inicio, hora_inicio + (duracao_minutos * INTERVAL '1 minute'))
        OVERLAPS
        ($3::time, $3::time + ($4::int * INTERVAL '1 minute'))
  ) AS conflito
  `;

  const resultado = await pool.query(query, [
    instrutor_id,
    dia_semana,
    hora_inicio,
    duracao_minutos,
    ignorarId,
  ]);

  return resultado.rows[0].conflito;
}

// CRIAR AULA

async function criar({
  nome,
  instrutor_id,
  dia_semana,
  hora_inicio,
  duracao_minutos,
  capacidade_maxima,
}) {
  const query = /* sql */ `
    INSERT INTO aulas (nome, instrutor_id, dia_semana, hora_inicio, duracao_minutos, capacidade_maxima)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const resultado = await pool.query(query, [
    nome,
    instrutor_id,
    dia_semana,
    hora_inicio,
    duracao_minutos,
    capacidade_maxima,
  ]);

  return resultado.rows[0];
}

// ATUALIZAR AULAS

async function atualizar(
  id,
  {
    nome,
    instrutor_id,
    dia_semana,
    hora_inicio,
    duracao_minutos,
    capacidade_maxima,
  },
) {
  const query = /* sql */ `
    UPDATE aulas
    SET nome = $1, instrutor_id = $2, dia_semana = $3,
        hora_inicio = $4, duracao_minutos = $5, capacidade_maxima = $6
    WHERE id = $7
    RETURNING *
  `;

  const resultado = await pool.query(query, [
    nome,
    instrutor_id,
    dia_semana,
    hora_inicio,
    duracao_minutos,
    capacidade_maxima,
    id,
  ]);

  return resultado.rows[0];
}

// EXCLUIR AULA
async function remover(id) {
  const query = 'DELETE FROM aulas WHERE id = $1 RETURNING *';
  const resultado = await pool.query(query, [id]);

  return resultado.rows[0];
}

module.exports = {
  listar,
  buscarPorId,
  buscarPorIdBloqueando,
  existeConflito,
  criar,
  atualizar,
  remover,
};
