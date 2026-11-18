
"use strict";

const { isListedInCatalog } = require("../domain/catalog");
const { quoteLines } = require("../domain/pricing");
const { totalsForOrder } = require("../domain/orderTotals");
const { normalizeAddress } = require("../domain/address");
const { validateQuantity } = require("../domain/quantity");
const { hasAvailableStock } = require("../domain/stock");

const recentCheckouts = new Map();
const CHECKOUT_WINDOW_MS = 5000;

function fingerprint(userId, body) {
  const items = (Array.isArray(body.items) ? body.items : [])
    .map((item) => `${item.productId}:${item.quantity}`)
    .sort()
    .join(",");

  const address = JSON.stringify(body.address || {});

  return `${userId}|${items}|${body.couponCode || ""}|${address}`;
}

function placeOrder(db, user, body) {
  if (!user || !user.id) {
    return {
      ok: false,
      status: 401,
      error: "Autenticação necessária.",
    };
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      status: 400,
      error: "Dados do pedido inválidos.",
    };
  }

  const addressResult = normalizeAddress(body.address);

  if (!addressResult.ok) {
    return {
      ok: false,
      status: 400,
      error: addressResult.message,
    };
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "O carrinho está vazio.",
    };
  }

  const key = fingerprint(user.id, body);
  const previous = recentCheckouts.get(key);

  if (previous && Date.now() - previous.at < CHECKOUT_WINDOW_MS) {
    return previous.result;
  }

  const groupedItems = new Map();

  for (const item of body.items) {
    if (!item || typeof item !== "object") {
      return {
        ok: false,
        status: 400,
        error: "Item do pedido inválido.",
      };
    }

    const product = db.findProduct(item.productId);

    if (!isListedInCatalog(product)) {
      return {
        ok: false,
        status: 400,
        error: "Produto não encontrado.",
      };
    }

    const quantityCheck = validateQuantity(item.quantity);

    if (!quantityCheck.ok) {
      return {
        ok: false,
        status: 400,
        error: quantityCheck.message,
      };
    }

    const current = groupedItems.get(product.id) || {
      product,
      quantity: 0,
    };

    current.quantity += quantityCheck.quantity;
    groupedItems.set(product.id, current);
  }

  const lines = [];
  const stockUpdates = [];

  for (const { product, quantity } of groupedItems.values()) {
    if (!hasAvailableStock(quantity, product.stock)) {
      return {
        ok: false,
        status: 400,
        error: `Estoque insuficiente para ${product.name}.`,
      };
    }

    const unitPrice = Number(product.price);

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return {
        ok: false,
        status: 400,
        error: `Preço inválido para ${product.name}.`,
      };
    }

    lines.push({
      productId: product.id,
      name: product.name,
      unitPrice,
      quantity,
    });

    stockUpdates.push({
      productId: product.id,
      quantity,
    });
  }

  let coupon = null;

  if (body.couponCode) {
    coupon = db.findCoupon(body.couponCode);

    if (!coupon) {
      return {
        ok: false,
        status: 400,
        error: "Cupom inválido.",
      };
    }
  }

  const quote = quoteLines({ lines, coupon });

  if (!quote.ok) {
    return {
      ok: false,
      status: 400,
      error: quote.message,
    };
  }

  const totals = totalsForOrder(quote);

  const order = {
    id: db.nextOrderId(),
    userId: user.id,
    createdAt: new Date().toISOString(),
    items: quote.items.map((item, index) => ({
      ...item,
      id: `item-${index + 1}`,
      unitPriceCents: Math.round(item.unitPrice * 100),
      lineTotalCents: Math.round(item.lineTotal * 100),
    })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    total: totals.total,
    subtotalCents: totals.subtotalCents,
    discountCents: totals.discountCents,
    shippingCents: totals.shippingCents,
    totalCents: totals.totalCents,
    couponId: coupon ? coupon.id : null,
    couponCode: coupon ? coupon.code : null,
    benefit: quote.benefit,
    address: addressResult.address,
    status: "confirmado",
  };

  const completion = db.completeOrder(order, stockUpdates);

  if (!completion.ok) {
    return {
      ok: false,
      status: 400,
      error: completion.error || "Não foi possível concluir o pedido.",
    };
  }

  const result = {
    ok: true,
    status: 201,
    order,
  };

  recentCheckouts.set(key, {
    at: Date.now(),
    result,
  });

  return result;
}

module.exports = {
  placeOrder,
};
