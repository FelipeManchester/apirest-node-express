const express = require('express');
const autenticar = require('../middlewares/autenticar');
const autorizar = require('../middlewares/autorizar');

const aulasRepository = require('../repositories/aulasRepository');
const matriculasRepository = require('../repositories/matriculasRepository');
const instrutorRepository = require('../repositories/instrutoresRepository');

const validar = require('../middlewares/validar');
const {
  criarAulaSchema,
  atualizarAulaSchema,
  idParamSchema,
  idsMatriculaParamSchema,
  listarAulasQuerySchema,
  cancelarMatriculaSchema,
} = require('../schemas');
const ErroDeDominio = require('../errors/ErroDeDominio');
const executarEmTransacao = require('../db/transacao');

const router = express.Router();

router.get(
  '/',
  validar({ query: listarAulasQuerySchema }),
  async (req, res) => {
    const aulas = await aulasRepository.listar({
      instrutor_id: req.query.instrutor_id,
    });

    res.json(aulas);
  },
);

router.get('/:id', validar({ params: idParamSchema }), async (req, res) => {
  const aula = await aulasRepository.buscarPorId(req.params.id);

  if (!aula) {
    return res.status(404).json({ erro: 'Aula não encontrada' });
  }

  res.json(aula);
});

router.post(
  '/',
  autenticar,
  autorizar('instrutor', 'admin'),
  validar({ body: criarAulaSchema }),
  async (req, res) => {
    const {
      nome,
      instrutor_id,
      dia_semana,
      hora_inicio,
      duracao_minutos,
      capacidade_maxima,
    } = req.body;

    if (
      req.usuario.papel === 'instrutor' &&
      Number(instrutor_id) !== req.usuario.id
    ) {
      return res.status(403).json({
        erro: 'Você só pode criar aulas para si mesmo',
      });
    }

    const instrutorExiste = await instrutorRepository.buscarPorId(instrutor_id);
    if (!instrutorExiste) {
      return res.status(422).json({
        erro: 'instrutor_id não corresponde a nenhum instrutor existente',
      });
    }

    const temConflito = await aulasRepository.existeConflito({
      instrutor_id,
      dia_semana,
      hora_inicio,
      duracao_minutos,
    });

    if (temConflito) {
      return res
        .status(422)
        .json({ erro: 'Instrutor já tem aula cadastrada nesse horário' });
    }

    const aulaCriada = await aulasRepository.criar({
      nome,
      instrutor_id,
      dia_semana,
      hora_inicio,
      duracao_minutos,
      capacidade_maxima,
    });

    res.status(201).location(`/aulas/${aulaCriada.id}`).json(aulaCriada);
  },
);

router.patch(
  '/:id',
  autenticar,
  autorizar('instrutor', 'admin'),
  validar({ params: idParamSchema, body: atualizarAulaSchema }),
  async (req, res) => {
    const aulaExistente = await aulasRepository.buscarPorId(req.params.id);

    if (!aulaExistente) {
      return res.status(404).json({ erro: 'Aula não encontrada' });
    }

    if (
      req.usuario.papel === 'instrutor' &&
      aulaExistente.instrutor_id !== req.usuario.id
    ) {
      return res
        .status(403)
        .json({ erro: 'Você só pode editar as suas próprias aulas' });
    }

    const dadosAtualizados = {
      nome: req.body.nome ?? aulaExistente.nome,
      instrutor_id: req.body.instrutor_id ?? aulaExistente.instrutor_id,
      dia_semana: req.body.dia_semana ?? aulaExistente.dia_semana,
      hora_inicio: req.body.hora_inicio ?? aulaExistente.hora_inicio,
      duracao_minutos:
        req.body.duracao_minutos ?? aulaExistente.duracao_minutos,
      capacidade_maxima:
        req.body.capacidade_maxima ?? aulaExistente.capacidade_maxima,
    };

    const temConflito = await aulasRepository.existeConflito({
      instrutor_id: dadosAtualizados.instrutor_id,
      dia_semana: dadosAtualizados.dia_semana,
      hora_inicio: dadosAtualizados.hora_inicio,
      duracao_minutos: dadosAtualizados.duracao_minutos,
      ignorarId: aulaExistente.id,
    });

    if (temConflito) {
      return res
        .status(422)
        .json({ erro: 'Instrutor já tem aula cadastrada nesse horário' });
    }

    const aulaAtualizada = await aulasRepository.atualizar(
      req.params.id,
      dadosAtualizados,
    );
    res.json(aulaAtualizada);
  },
);

router.delete(
  '/:id',
  autenticar,
  autorizar('instrutor', 'admin'),
  validar({ params: idParamSchema }),
  async (req, res) => {
    const aula = await aulasRepository.buscarPorId(req.params.id);

    if (!aula) {
      return res.status(404).json({ erro: 'Aula não encontrada' });
    }

    if (
      req.usuario.papel === 'instrutor' &&
      aula.instrutor_id !== req.usuario.id
    ) {
      return res
        .status(403)
        .json({ erro: 'Você só pode remover as suas próprias aulas' });
    }

    await aulasRepository.remover(req.params.id);
    res.status(204).send();
  },
);

router.post(
  '/:id/matriculas',
  autenticar,
  autorizar('aluno'),
  validar({ params: idParamSchema }),
  async (req, res) => {
    try {
      const matriculaCriada = await executarEmTransacao(async (client) => {
        const aula = await aulasRepository.buscarPorIdBloqueando(
          req.params.id,
          client,
        );

        if (!aula) {
          throw new ErroDeDominio('Aula não encontrada', 404);
        }

        const totalConfirmadas = await matriculasRepository.contarConfirmadas(
          aula.id,
          client,
        );

        if (totalConfirmadas >= aula.capacidade_maxima) {
          throw new ErroDeDominio('Aula sem vagas disponíveis', 409);
        }

        return matriculasRepository.criar(
          { aluno_id: req.usuario.id, aula_id: aula.id },
          client,
        );
      });

      res
        .status(201)
        .location(`/aulas/${req.params.id}/matriculas/${matriculaCriada.id}`)
        .json(matriculaCriada);
    } catch (err) {
      if (err.code === '23505') {
        throw new ErroDeDominio('Aluno já matriculado nesta aula', 409);
      }
      throw err;
    }
  },
);

router.patch(
  '/:id/matriculas/:matriculaId',
  autenticar,
  validar({ params: idsMatriculaParamSchema, body: cancelarMatriculaSchema }),
  async (req, res) => {
    const matricula = await matriculasRepository.buscarPorIdEAula(
      req.params.matriculaId,
      req.params.id,
    );

    if (!matricula) {
      return res.status(404).json({ erro: 'Matrícula não encontrada' });
    }

    if (
      req.usuario.papel !== 'aluno' ||
      matricula.aluno_id !== req.usuario.id
    ) {
      return res.status(403).json({
        erro: 'Você não pode cancelar a matrícula de outro aluno',
      });
    }

    const matriculaCancelada = await matriculasRepository.cancelar(
      matricula.id,
    );
    res.json(matriculaCancelada);
  },
);

router.get(
  '/:id/matriculas',
  autenticar,
  autorizar('instrutor', 'admin'),
  validar({ params: idParamSchema }),
  async (req, res) => {
    const aula = await aulasRepository.buscarPorId(req.params.id);

    if (!aula) {
      return res.status(404).json({ erro: 'Aula não encontrada' });
    }

    if (
      req.usuario.papel === 'instrutor' &&
      aula.instrutor_id !== req.usuario.id
    ) {
      return res.status(403).json({
        erro: 'Você só pode ver a lista de chamada das suas próprias aulas',
      });
    }

    const matriculas = await matriculasRepository.listarPorAula(req.params.id);
    res.json(matriculas);
  },
);

module.exports = router;
