export const up = (pgm) => {
  pgm.createIndex('alunos', 'nome', { ifNotExists: true });
  pgm.createIndex('instrutores', 'nome', { ifNotExists: true });
  pgm.createIndex('aulas', 'nome', { ifNotExists: true });
};

export const down = (pgm) => {
  pgm.dropIndex('alunos', 'nome', { ifExists: true });
  pgm.dropIndex('instrutores', 'nome', { ifExists: true });
  pgm.dropIndex('aulas', 'nome', { ifExists: true });
};
