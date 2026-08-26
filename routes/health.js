const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

let desligando = false;
const iniciarDesligamento = () => {
  desligando = true;
};

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime_segundos: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.get('/ready', async (req, res) => {
  if (desligando) {
    return res.status(503).json({ status: 'desligando' });
  }

  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', banco: 'ok' });
  } catch (err) {
    req.log.error({ err }, 'readiness falhou: banco inacessível');
    res.status(503).json({ status: 'indisponivel', banco: 'inacessivel' });
  }
});

module.exports = { router, iniciarDesligamento };
