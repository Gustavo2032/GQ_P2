"use strict";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { seedDatabase } = require("../../scripts/dataset");
const { openDatabase } = require("../../src/persistence/database");
const { createServer } = require("../../server");

const dbFile = path.join(
  __dirname,
  "..",
  "..",
  "data",
  `db-security-${process.pid}.json`
);

let server;
let baseUrl;

before(async () => {
  await seedDatabase(dbFile);

  const db = openDatabase(dbFile);
  server = createServer(db);

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  fs.rmSync(dbFile, { force: true });
});

async function login(email) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: require("../../scripts/dataset").TEST_PASSWORD,
    }),
  });

  assert.equal(response.status, 200);
  return (await response.json()).token;
}

test("alteração de produto sem login é bloqueada", async () => {
  const response = await fetch(
    `${baseUrl}/api/admin/products/produto-teste`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: 10 }),
    }
  );

  assert.equal(response.status, 401);
});

test("cliente comum não pode alterar produto", async () => {
  const token = await login("cliente-a@loja.test");

  const response = await fetch(
    `${baseUrl}/api/admin/products/produto-teste`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stock: 10 }),
    }
  );

  assert.equal(response.status, 403);
});

test("administrador autenticado pode alterar produto", async () => {
  const token = await login("admin@loja.test");

  const response = await fetch(
    `${baseUrl}/api/admin/products/produto-teste`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ description: "Descrição atualizada pelo teste" }),
    }
  );

  assert.equal(response.status, 200);
});

test("cliente não pode consultar pedido de outro cliente", async () => {
  const token = await login("cliente-a@loja.test");

  const response = await fetch(
    `${baseUrl}/api/orders/pedido-cliente-b`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  assert.equal(response.status, 404);
});

test("cliente pode consultar o próprio pedido", async () => {
  const token = await login("cliente-b@loja.test");

  const response = await fetch(
    `${baseUrl}/api/orders/pedido-cliente-b`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  assert.equal(response.status, 200);
});