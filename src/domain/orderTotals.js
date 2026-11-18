
"use strict";

const { toCents, fromCents } = require("./money");

function totalsForOrder(quote) {
  const subtotalCents = toCents(quote.subtotal);
  const discountCents = toCents(quote.discount);
  const shippingCents = toCents(quote.shipping);

  const totalCents =
    subtotalCents - discountCents + shippingCents;

  return {
    subtotal: fromCents(subtotalCents),
    discount: fromCents(discountCents),
    shipping: fromCents(shippingCents),
    total: fromCents(totalCents),
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents,
  };
}

module.exports = {
  totalsForOrder,
};
