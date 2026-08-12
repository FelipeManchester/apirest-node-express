const pool = require('../db/pool');

async function contarConfirmadas(aula_id) {
  const resultado = await pool.query(
    /* sql */ `SELECT COUNT(*)::int AS total
               FROM matriculas
               WHERE aula_id = $1 AND status = 'confirmada'`,
    [aula_id],
  );
  return resultado.rows[0].total;
}

async function criar({ aluno_id, aula_id }) {
  const resultado = await pool.query(
    /* sql */ `INSERT INTO matriculas (aluno_id, aula_id)
               VALUES ($1, $2)
               RETURNING *`,
    [aluno_id, aula_id],
  );
  return resultado.rows[0];
}

async function listarPorAula(aula_id) {
  const resultado = await pool.query(
    /* sql */ `SELECT matriculas.id, matriculas.status, matriculas.criado_em,
                      alunos.id AS aluno_id, alunos.nome AS aluno_nome, alunos.email AS aluno_email
               FROM matriculas
               JOIN alunos ON alunos.id = matriculas.aluno_id
               WHERE matriculas.aula_id = $1
               ORDER BY matriculas.id`,
    [aula_id],
  );
  return resultado.rows;
}

async function listarPorAluno(aluno_id) {
  const resultado = await pool.query(
    /* sql */ `SELECT matriculas.id, matriculas.status, matriculas.criado_em,
                      aulas.id AS aula_id, aulas.nome AS aula_nome,
                      aulas.dia_semana, aulas.hora_inicio
               FROM matriculas
               JOIN aulas ON aulas.id = matriculas.aula_id
               WHERE matriculas.aluno_id = $1
               ORDER BY matriculas.id`,
    [aluno_id],
  );
  return resultado.rows;
}

async function buscarPorIdEAula(id, aula_id) {
  const resultado = await pool.query(
    'SELECT * FROM matriculas WHERE id = $1 AND aula_id = $2',
    [id, aula_id],
  );
  return resultado.rows[0];
}

async function cancelar(id) {
  const resultado = await pool.query(
    "UPDATE matriculas SET status = 'cancelada' WHERE id = $1 RETURNING *",
    [id],
  );
  return resultado.rows[0];
}

module.exports = {
  contarConfirmadas,
  criar,
  listarPorAula,
  listarPorAluno,
  buscarPorIdEAula,
  cancelar,
};
