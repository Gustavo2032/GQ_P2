
"use strict";

const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { seedDatabase } = require("../../scripts/dataset");
const { openDatabase } = require("../../src/persistence/database");
const { placeOrder } = require("../../src/services/checkout");

let dbFile;
let db;
let user;
let testNumber = 0;

const address = {
  street: "Rua de Teste",
  number: "100",
  district: "Centro",
  city: "Saquarema",
  state: "RJ",
  zip: "28990000",
};

beforeEach(async () => {
  testNumber += 1;

  dbFile = path.join(
    __dirname,
    "..",
    "..",
    "data",
    `db-checkout-${process.pid}-${testNumber}.json`
  );

  await seedDatabase(dbFile);
  db = openDatabase(dbFile);
  user = db.findUserById("cliente-a");

  assert.ok(user, "Usuário de teste deve existir");
});

afterEach(() => {
  if (dbFile) {
    fs.rmSync(dbFile, { force: true });
  }
});

function checkoutBody(overrides = {}) {
  return {
    items: [
      {
        productId: "produto-teste",
        quantity: 1,
        unitPrice: 1,
      },
    ],
    address,
    ...overrides,
  };
}

test("checkout utiliza o preço cadastrado, não o preço enviado pelo cliente", () => {
  const result = placeOrder(db, user, checkoutBody());

  assert.equal(result.ok, true);
  assert.equal(result.order.subtotal, 150);
});

test("checkout rejeita quantidade maior que o estoque", () => {
  const result = placeOrder(
    db,
    user,
    checkoutBody({
      items: [
        {
          productId: "produto-teste",
          quantity: 6,
          unitPrice: 150,
        },
      ],
    })
  );

  assert.equal(result.ok, false);
  assert.equal(db.findProduct("produto-teste").stock, 5);
});

test("checkout reduz o estoque após compra aprovada", () => {
  const result = placeOrder(db, user, checkoutBody());

  assert.equal(result.ok, true);
  assert.equal(db.findProduct("produto-teste").stock, 4);
});

test("checkout rejeita endereço incompleto", () => {
  const result = placeOrder(
    db,
    user,
    checkoutBody({ address: {} })
  );

  assert.equal(result.ok, false);
});

test("checkout persiste o pedido no banco", () => {
  const result = placeOrder(db, user, checkoutBody());

  assert.equal(result.ok, true);

  const reopenedDatabase = openDatabase(dbFile);
  const savedOrder = reopenedDatabase.findOrder(result.order.id);

  assert.ok(savedOrder);
  assert.equal(savedOrder.userId, user.id);
});

test("total do pedido desconta o desconto aplicado", () => {
  const result = placeOrder(
    db,
    user,
    checkoutBody({
      items: [
        {
          productId: "produto-teste",
          quantity: 2,
          unitPrice: 150,
        },
      ],
    })
  );

  assert.equal(result.ok, true);
  assert.equal(result.order.subtotal, 300);
  assert.equal(result.order.discount, 30);
  assert.equal(result.order.total, 270);
});
