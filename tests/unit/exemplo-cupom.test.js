
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  evaluateCoupon,
  couponBenefit
} = require("../../src/domain/coupon");
const { quoteLines } = require("../../src/domain/pricing");

test("CP-02 - aceita cupom percentual válido", () => {
  assert.equal(
    evaluateCoupon({ type: "percent", value: 20, active: true }).ok,
    true
  );
});

test("CP-02 - aceita cupom de valor fixo válido", () => {
  assert.equal(
    evaluateCoupon({ type: "fixed", value: 30, active: true }).ok,
    true
  );
});

test("CP-02 - rejeita cupom inexistente", () => {
  assert.equal(evaluateCoupon(null, 100).ok, false);
});

test("CP-02 - rejeita cupom inativo", () => {
  assert.equal(
    evaluateCoupon({ type: "percent", value: 10, active: false }).ok,
    false
  );
});

test("CP-02 - rejeita cupom expirado", () => {
  assert.equal(
    evaluateCoupon({
      type: "percent",
      value: 10,
      expiresAt: "2000-01-01"
    }).ok,
    false
  );
});

test("CP-02 - rejeita cupom com início futuro", () => {
  assert.equal(
    evaluateCoupon({
      type: "percent",
      value: 10,
      startsAt: "2999-01-01"
    }).ok,
    false
  );
});

test("CP-02 - rejeita percentual acima de 100", () => {
  assert.equal(
    evaluateCoupon({ type: "percent", value: 101 }).ok,
    false
  );
});

test("CP-02 - aceita percentual exatamente igual a 100", () => {
  assert.equal(
    evaluateCoupon({ type: "percent", value: 100 }).ok,
    true
  );
});

test("CP-02 - rejeita valor zero", () => {
  assert.equal(
    evaluateCoupon({ type: "fixed", value: 0 }).ok,
    false
  );
});

test("CP-02 - rejeita valor negativo", () => {
  assert.equal(
    evaluateCoupon({ type: "fixed", value: -10 }).ok,
    false
  );
});

test("CP-02 - rejeita tipo de cupom inválido", () => {
  assert.equal(
    evaluateCoupon({ type: "desconhecido", value: 10 }).ok,
    false
  );
});

test("CP-02 - rejeita subtotal abaixo do mínimo", () => {
  assert.equal(
    evaluateCoupon({
      type: "percent",
      value: 10,
      minimumSubtotalCents: 10000
    }, 99.99).ok,
    false
  );
});

test("CP-02 - aceita subtotal exatamente no mínimo", () => {
  assert.equal(
    evaluateCoupon({
      type: "percent",
      value: 10,
      minimumSubtotalCents: 10000
    }, 100).ok,
    true
  );
});

test("CP-02 - calcula desconto percentual corretamente", () => {
  assert.equal(
    couponBenefit(100, { type: "percent", value: 20 }),
    20
  );
});

test("CP-02 - limita desconto fixo ao subtotal", () => {
  assert.equal(
    couponBenefit(100, { type: "fixed", value: 150 }),
    100
  );
});

test("CP-02 - cupom e desconto automático não se acumulam", () => {
  const quote = quoteLines({
    lines: [{
      productId: "p-exemplo",
      name: "Kit",
      unitPrice: 250,
      quantity: 1
    }],
    coupon: {
      code: "BEMVINDO",
      type: "fixed",
      value: 30,
      expiresAt: "2027-12-31",
      active: true
    }
  });

  assert.equal(quote.ok, true);
  assert.equal(quote.automaticDiscount, 25);
  assert.equal(quote.couponDiscount, 30);
  assert.equal(quote.discount, 30);
});
