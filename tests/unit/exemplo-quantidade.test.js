
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { validateQuantity } = require("../../src/domain/quantity");
const { hasAvailableStock } = require("../../src/domain/stock");

// Partições de equivalência e valores-limite

test("CP-01 - aceita quantidade mínima igual a 1", () => {
  const result = validateQuantity(1);
  assert.equal(result.ok, true);
  assert.equal(result.quantity, 1);
});

test("CP-01 - aceita quantidade positiva maior que 1", () => {
  assert.equal(validateQuantity(2).ok, true);
});

test("CP-01 - aceita inteiro enviado como texto", () => {
  const result = validateQuantity("5");
  assert.equal(result.ok, true);
  assert.equal(result.quantity, 5);
});

test("CP-01 - rejeita quantidade zero", () => {
  assert.equal(validateQuantity(0).ok, false);
});

test("CP-01 - rejeita quantidade negativa", () => {
  assert.equal(validateQuantity(-1).ok, false);
});

test("CP-01 - rejeita quantidade decimal", () => {
  assert.equal(validateQuantity(1.5).ok, false);
});

test("CP-01 - rejeita texto vazio", () => {
  assert.equal(validateQuantity("").ok, false);
});

test("CP-01 - rejeita texto não numérico", () => {
  assert.equal(validateQuantity("abc").ok, false);
});

test("CP-01 - aceita venda da última unidade em estoque", () => {
  assert.equal(hasAvailableStock(1, 1), true);
});

test("CP-01 - aceita quantidade igual ao estoque disponível", () => {
  assert.equal(hasAvailableStock(5, 5), true);
});

test("CP-01 - rejeita quantidade acima do estoque", () => {
  assert.equal(hasAvailableStock(6, 5), false);
});

test("CP-01 - rejeita quantidade zero no estoque", () => {
  assert.equal(hasAvailableStock(0, 5), false);
});
