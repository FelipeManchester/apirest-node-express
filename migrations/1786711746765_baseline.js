export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS instrutores (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      especialidade VARCHAR(80) NOT NULL,
      email VARCHAR(160) UNIQUE,
      senha_hash VARCHAR(60),
      papel VARCHAR(10) NOT NULL DEFAULT 'instrutor'
        CHECK (papel IN ('instrutor', 'admin'))
    );

    CREATE TABLE IF NOT EXISTS alunos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      data_nascimento DATE NOT NULL,
      senha_hash VARCHAR(60),
      criado_em TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS aulas (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      instrutor_id INTEGER NOT NULL REFERENCES instrutores(id) ON DELETE RESTRICT,
      dia_semana VARCHAR(10) NOT NULL
        CHECK (dia_semana IN ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo')),
      hora_inicio TIME NOT NULL,
      duracao_minutos INTEGER NOT NULL CHECK (duracao_minutos > 0),
      capacidade_maxima INTEGER NOT NULL CHECK (capacidade_maxima > 0)
    );

    CREATE TABLE IF NOT EXISTS matriculas (
      id SERIAL PRIMARY KEY,
      aluno_id INTEGER NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
      aula_id INTEGER NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
      status VARCHAR(10) NOT NULL DEFAULT 'confirmada'
        CHECK (status IN ('confirmada', 'cancelada')),
      criado_em TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS matriculas_aluno_aula_confirmada_idx
      ON matriculas (aluno_id, aula_id)
      WHERE status = 'confirmada';

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      aluno_id INTEGER REFERENCES alunos(id) ON DELETE CASCADE,
      instrutor_id INTEGER REFERENCES instrutores(id) ON DELETE CASCADE,
      CHECK ((aluno_id IS NOT NULL)::int + (instrutor_id IS NOT NULL)::int = 1),
      token_hash CHAR(64) NOT NULL UNIQUE,
      expira_em TIMESTAMP NOT NULL,
      revogado_em TIMESTAMP,
      criado_em TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS refresh_tokens_aluno_id_idx
      ON refresh_tokens (aluno_id);
  `);
};

export const down = () => {
  throw new Error('A migration baseline não é reversível.');
};
