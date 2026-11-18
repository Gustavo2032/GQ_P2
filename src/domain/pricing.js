
"use strict";

const { toCents, fromCents } = require("./money");
const { automaticDiscount } = require("./discount");
const { shippingCost } = require("./shipping");
const { validateQuantity } = require("./quantity");
const { evaluateCoupon, couponBenefit } = require("./coupon");

function quoteLines({ lines, coupon = null }) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, message: "O carrinho está vazio." };
  }

  const items = [];

  for (const line of lines) {
    if (!line || typeof line !== "object" || Array.isArray(line)) {
      return { ok: false, message: "Item do carrinho inválido." };
    }

    const check = validateQuantity(line.quantity);

    if (!check.ok) {
      return { ok: false, message: check.message };
    }

    const unitPrice = Number(line.unitPrice);

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return { ok: false, message: "Preço inválido." };
    }

    const unitPriceCents = toCents(unitPrice);
    const lineTotalCents = unitPriceCents * check.quantity;

    if (
      !Number.isSafeInteger(unitPriceCents) ||
      !Number.isSafeInteger(lineTotalCents)
    ) {
      return { ok: false, message: "Valor do item inválido." };
    }

    items.push({
      productId: line.productId,
      name: line.name,
      unitPrice: fromCents(unitPriceCents),
      quantity: check.quantity,
      lineTotal: fromCents(lineTotalCents),
    });
  }

  const subtotalCents = items.reduce(
    (sum, item) => sum + toCents(item.lineTotal),
    0
  );

  if (!Number.isSafeInteger(subtotalCents)) {
    return { ok: false, message: "Subtotal inválido." };
  }

  const subtotal = fromCents(subtotalCents);

  if (coupon) {
    const evaluation = evaluateCoupon(coupon, subtotal);

    if (!evaluation.ok) {
      return { ok: false, message: evaluation.message };
    }
  }

  const automatic = automaticDiscount(subtotal);
  const fromCoupon = coupon ? couponBenefit(subtotal, coupon) : 0;
  const discount = Math.max(automatic, fromCoupon);

  let benefit = null;

  if (discount > 0) {
    benefit = automatic >= fromCoupon ? "automatico" : "cupom";
  }

  const shipping = shippingCost(subtotal);
  const total = fromCents(
    subtotalCents - toCents(discount) + toCents(shipping)
  );

  return {
    ok: true,
    items,
    subtotal,
    discount,
    automaticDiscount: automatic,
    couponDiscount: fromCoupon,
    benefit,
    shipping,
    total,
  };
}

module.exports = { quoteLines };
