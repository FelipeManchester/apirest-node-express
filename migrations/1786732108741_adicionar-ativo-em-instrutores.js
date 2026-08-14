export const up = (pgm) => {
  pgm.addColumns('instrutores', {
    ativo: { type: 'boolean', notNull: true, default: true },
  });
};

export const down = (pgm) => {
  pgm.dropColumns('instrutores', ['ativo']);
};
