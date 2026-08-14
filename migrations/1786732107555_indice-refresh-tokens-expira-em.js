export const up = (pgm) => {
  pgm.createIndex('refresh_tokens', 'expira_em', {
    name: 'refresh_tokens_expira_em_idx',
    ifNotExists: true,
  });
};

export const down = (pgm) => {
  pgm.dropIndex('refresh_tokens', 'expira_em', {
    name: 'refresh_tokens_expira_em_idx',
    ifExists: true,
  });
};
