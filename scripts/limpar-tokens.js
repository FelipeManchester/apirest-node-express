require('dotenv').config();

const pool = require('../db/pool');
const refreshTokensRepository = require('../repositories/refreshTokensRepository');

const DIAS_DE_RETENCAO = Number(process.env.RETENCAO_TOKENS_DIAS || 30);

async function main() {
  const removidos =
    await refreshTokensRepository.removerExpirados(DIAS_DE_RETENCAO);

  console.log(
    `[limpar-tokens] ${new Date().toISOString()} | retenção: ${DIAS_DE_RETENCAO} dias | removidos: ${removidos}`,
  );
}

main()
  .catch((erro) => {
    console.error('[limpar-tokens] falhou:', erro.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
