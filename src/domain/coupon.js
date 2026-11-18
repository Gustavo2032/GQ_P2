
"use strict";

const { toCents, fromCents, percentOf } = require("./money");
const { now } = require("./clock");

function evaluateCoupon(coupon, subtotal) {
  if (
    !coupon ||
    typeof coupon !== "object" ||
    Array.isArray(coupon) ||
    coupon.active === false
  ) {
    return { ok: false, message: "Cupom inválido." };
  }

  if (coupon.type !== "percent" && coupon.type !== "fixed") {
    return { ok: false, message: "Tipo de cupom inválido." };
  }

  const value = Number(coupon.value);

  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    (coupon.type === "percent" && value > 100)
  ) {
    return { ok: false, message: "Valor do cupom inválido." };
  }

  if (coupon.startsAt != null) {
    const start = new Date(coupon.startsAt);

    if (
      Number.isNaN(start.getTime()) ||
      start.getTime() > now().getTime()
    ) {
      return {
        ok: false,
        message: "Cupom ainda não está válido ou possui data de início inválida.",
      };
    }
  }

  if (coupon.expiresAt != null) {
    const expiration = new Date(coupon.expiresAt);

    if (
      Number.isNaN(expiration.getTime()) ||
      expiration.getTime() < now().getTime()
    ) {
      return {
        ok: false,
        message: "Cupom expirado ou com validade inválida.",
      };
    }
  }

  if (coupon.minimumSubtotalCents != null) {
    const minimum = Number(coupon.minimumSubtotalCents);

    if (!Number.isSafeInteger(minimum) || minimum < 0) {
      return {
        ok: false,
        message: "Subtotal mínimo do cupom inválido.",
      };
    }

    if (subtotal !== undefined) {
      const subtotalCents = toCents(subtotal);

      if (
        !Number.isSafeInteger(subtotalCents) ||
        subtotalCents < minimum
      ) {
        return {
          ok: false,
          message: "O valor mínimo para utilizar este cupom não foi atingido.",
        };
      }
    }
  }

  return { ok: true };
}

function couponBenefit(subtotal, coupon) {
  if (!coupon) return 0;

  const value = Number(coupon.value);

  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    (coupon.type !== "percent" && coupon.type !== "fixed") ||
    (coupon.type === "percent" && value > 100)
  ) {
    return 0;
  }

  if (coupon.type === "percent") {
    return percentOf(subtotal, value);
  }

  const benefitCents = toCents(value);
  const subtotalCents = toCents(subtotal);

  return fromCents(Math.min(benefitCents, subtotalCents));
}

module.exports = { evaluateCoupon, couponBenefit };
