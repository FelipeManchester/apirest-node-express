import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.node } },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  // node-pg-migrate gera migrations em ESM (export const up/down) e as carrega
  // por conta própria — o resto do projeto continua CommonJS.
  { files: ["migrations/**/*.js"], languageOptions: { sourceType: "module" } },
  // describe/it/expect/afterAll são injetados pelo Jest em tempo de execução.
  { files: ["tests/**/*.js"], languageOptions: { globals: globals.jest } },
  { rules: { "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }] } },
]);
