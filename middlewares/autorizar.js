function autorizar(...papeisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Token não enviado' });
    }

    if (!papeisPermitidos.includes(req.usuario.papel)) {
      return res.status(403).json({
        erro: 'Você não tem permissão para acessar este recurso',
      });
    }

    next();
  };
}

module.exports = autorizar;
