function validar(schemas) {
  return (req, res, next) => {
    for (const origem of ['body', 'params', 'query']) {
      const schema = schemas[origem];

      if (!schema) continue;

      const resultado = schema.safeParse(req[origem]);

      if (!resultado.success) {
        return res.status(400).json({
          erro: 'Dados inválidos',
          detalhes: resultado.error.issues.map((problema) => ({
            campo: problema.path.join('.') || origem,
            mensagem: problema.message,
          })),
        });
      }
      req[origem] = resultado.data;
    }
    next();
  };
}

module.exports = validar;
