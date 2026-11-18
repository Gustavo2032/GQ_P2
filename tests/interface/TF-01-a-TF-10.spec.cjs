
"use strict";

const { test, expect, request } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const { seedDatabase } = require("../../scripts/dataset");
const { openDatabase } = require("../../src/persistence/database");
const { createServer } = require("../../server");

let dbFile;
let db;
let server;
let api;
let baseURL;

const address = {
  street: "Rua de Teste",
  number: "100",
  district: "Centro",
  city: "Saquarema",
  state: "RJ",
  zip: "28990000"
};

async function login(email, password = "SenhaDidatica123!") {
  const response = await api.post("/api/auth/login", {
    data: { email, password }
  });

  expect(response.status()).toBe(200);
  return (await response.json()).token;
}

test.beforeEach(async () => {
  dbFile = path.join(
    __dirname,
    "..",
    "..",
    "data",
    `db-tf-${process.pid}-${Date.now()}.json`
  );

  await seedDatabase(dbFile);
  db = openDatabase(dbFile);

  server = createServer(db);

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  baseURL = `http://127.0.0.1:${server.address().port}`;

  api = await request.newContext({ baseURL });
});

test.afterEach(async () => {
  if (api) await api.dispose();

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  if (dbFile) {
    fs.rmSync(dbFile, { force: true });
  }
});

// TF-01 - Cadastro de clientes
test("TF-01 - Cadastro de clientes", async () => {
  const email = `tf01-${Date.now()}@loja.test`;

  const response = await api.post("/api/auth/register", {
    data: {
      name: "Cliente Teste",
      email,
      password: "Senha123!"
    }
  });

  expect(response.status()).toBe(201);

  const duplicate = await api.post("/api/auth/register", {
    data: {
      name: "Cliente Teste",
      email,
      password: "Senha123!"
    }
  });

  expect(duplicate.status()).toBe(400);
});

// TF-02 - Login e logout
test("TF-02 - Login e logout", async () => {
  const token = await login("cliente-a@loja.test");

  const authenticated = await api.get("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` }
  });

  expect(authenticated.status()).toBe(200);

  const logout = await api.post("/api/auth/logout", {
    headers: { Authorization: `Bearer ${token}` },
    data: {}
  });

  expect(logout.status()).toBe(200);

  const afterLogout = await api.get("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` }
  });

  expect(afterLogout.status()).toBe(401);
});

// TF-03 - Consulta do catálogo
test("TF-03 - Catálogo apresenta produtos disponíveis", async () => {
  const response = await api.get("/api/products");

  expect(response.status()).toBe(200);

  const products = await response.json();

  expect(Array.isArray(products)).toBe(true);
  expect(products.some(p => p.id === "produto-teste")).toBe(true);
});

// TF-04 - Busca e filtros
test("TF-04 - Busca filtra produtos", async ({ page }) => {
  await page.goto(`${baseURL}/#catalogo`);

  await expect(page.locator("#catalog-grid")).toBeVisible();

  await page.locator("#search").fill("produto-inexistente-tf04");

  await expect(
    page.locator(
      '#catalog-grid [data-testid="product-card"]:visible'
    )
  ).toHaveCount(0);
});

// TF-05 - Gerenciamento do carrinho
test("TF-05 - Adicionar produto ao carrinho", async ({ page }) => {
  await page.goto(`${baseURL}/#catalogo`);

  const addButton = page.locator(
    '[data-testid="add-to-cart"][data-product-id="produto-teste"]'
  );

  await expect(addButton).toBeVisible();
  await addButton.click();

  await expect(page.locator("#cart-count")).toHaveText("1");
});

// TF-06 - Controle de estoque
test("TF-06 - Sistema rejeita compra acima do estoque", async () => {
  const token = await login("cliente-a@loja.test");

  const response = await api.post("/api/checkout", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      items: [
        {
          productId: "produto-teste",
          quantity: 6,
          unitPrice: 150
        }
      ],
      address
    }
  });

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(db.findProduct("produto-teste").stock).toBe(5);
});

// TF-07 - Cupons e cálculo de valores
test("TF-07 - Aplicação de cupom e cálculo do orçamento", async () => {
  const response = await api.post("/api/cart/quote", {
    data: {
      items: [
        {
          productId: "produto-teste",
          quantity: 2
        }
      ],
      couponCode: "VINTE"
    }
  });

  expect(response.status()).toBe(200);

  const quote = await response.json();

  expect(quote.discount).toBeGreaterThan(0);
  expect(quote.subtotal).toBe(300);
});

// TF-08 - Endereço e finalização da compra
test("TF-08 - Finalização de compra com endereço válido", async () => {
  const token = await login("cliente-a@loja.test");

  const response = await api.post("/api/checkout", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      items: [
        {
          productId: "produto-teste",
          quantity: 1,
          unitPrice: 1
        }
      ],
      address
    }
  });

  expect(response.status()).toBeLessThan(300);

  const result = await response.json();

  expect(result.order).toBeTruthy();
  expect(result.order.subtotal).toBe(150);
  expect(db.findProduct("produto-teste").stock).toBe(4);
});

// TF-09 - Histórico e detalhes dos pedidos
test("TF-09 - Consulta do histórico de pedidos", async () => {
  const token = await login("cliente-a@loja.test");

  const response = await api.get("/api/orders", {
    headers: { Authorization: `Bearer ${token}` }
  });

  expect(response.status()).toBe(200);

  const orders = await response.json();

  expect(Array.isArray(orders)).toBe(true);
});

// TF-10 - Administração de produtos
test("TF-10 - Administrador cadastra e altera produto", async () => {
  const token = await login("admin@loja.test");

  const created = await api.post("/api/admin/products", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: "Produto TF10",
      description: "Produto criado para teste",
      category: "Teste",
      price: 50,
      stock: 10
    }
  });

  expect(created.status()).toBe(201);

  const product = await created.json();

  const updated = await api.put(
    `/api/admin/products/${product.id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: "Produto TF10 Alterado",
        price: 60,
        stock: 15
      }
    }
  );

  expect(updated.status()).toBe(200);

  const result = await updated.json();

  expect(result.name).toBe("Produto TF10 Alterado");
  expect(result.price).toBe(60);
  expect(result.stock).toBe(15);
});
