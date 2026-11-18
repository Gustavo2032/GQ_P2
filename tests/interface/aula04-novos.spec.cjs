const { test, expect } = require('@playwright/test');

test('Teste 4 - catálogo exibe produtos', async ({ page }) => {
  await page.goto('/#catalogo');

  await expect(page.locator('#catalog-grid')).toBeVisible();
  await expect(
    page.locator('#catalog-grid [data-testid="product-card"]').first()
  ).toBeVisible();
});

test('Teste 5 - busca filtra produtos', async ({ page }) => {
  await page.goto('/#catalogo');
  await page.locator('#search').fill('produto-inexistente-xyz');

  await expect(
    page.locator('#catalog-grid [data-testid="product-card"]:visible')
  ).toHaveCount(0);
});

test('Teste 6 - filtro de categoria está disponível', async ({ page }) => {
  await page.goto('/#catalogo');

  const filtro = page.locator('#category-filter');

  await expect(filtro).toBeVisible();
  await expect(filtro.locator('option')).not.toHaveCount(0);
});

test('Teste 7 - botão adicionar ao carrinho está habilitado', async ({ page }) => {
  await page.goto('/#catalogo');

  const botao = page.getByRole('button', {
    name: 'Adicionar ao carrinho'
  }).first();

  await expect(botao).toBeVisible();
  await expect(botao).toBeEnabled();
});