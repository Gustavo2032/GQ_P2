
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { evaluateCoupon, couponBenefit } = require("../../src/domain/coupon");
const {
  setClock,
  resetClock,
  REFERENCE_INSTANT,
} = require("../../src/domain/clock");

test("extra 1: cupom inexistente é recusado", () => {
  assert.equal(evaluateCoupon(null).ok, false);
});

test("extra 2: cupom com data de validade inválida é recusado", () => {
  setClock(REFERENCE_INSTANT);

  try {
    const resultado = evaluateCoupon({
      code: "INVALIDO",
      type: "percent",
      value: 20,
      expiresAt: "data-invalida",
      active: true,
    });

    assert.equal(resultado.ok, false);
  } finally {
    resetClock();
  }
});

test("extra 3: cupom válido no futuro é aceito", () => {
  setClock(REFERENCE_INSTANT);

  try {
    const resultado = evaluateCoupon({
      code: "FUTURO",
      type: "percent",
      value: 20,
      expiresAt: "2026-12-31T23:59:59Z",
      active: true,
    });

    assert.equal(resultado.ok, true);
  } finally {
    resetClock();
  }
});

test("extra 4: cupom fixo não concede benefício acima do subtotal", () => {
  const beneficio = couponBenefit(50, {
    code: "FIXO100",
    type: "fixed",
    value: 100,
    active: true,
  });

  assert.equal(beneficio, 50);
});
