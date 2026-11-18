const test = require('node:test');
const assert = require('node:assert/strict');

const { automaticDiscount } = require('../../src/domain/discount');
const { validateQuantity } = require('../../src/domain/quantity');
const { quoteLines } = require('../../src/domain/pricing');
const { percentOf } = require('../../src/domain/money');
function cotar(preco, quantidade = 1) {
  return quoteLines({
    lines: [
      {
        productId: 'produto-teste',
        name: 'Produto Teste',
        unitPrice: preco,
        quantity: quantidade
      }
    ]
  });
}

test('unitário: preço exatamente abaixo de 200 não recebe desconto', () => { assert.equal(automaticDiscount(199.99), 0); });

test('unitário: preço acima de 200 recebe 10% de desconto', () => { assert.equal(automaticDiscount(250), 25); });

test('unitário: quantidade negativa é inválida', () => { assert.equal(validateQuantity(-1).ok, false); });

test('unitário: 10% de 100.05 arredonda para 10.01', () => { assert.equal(percentOf(100.05, 10), 10.01); });


test('unitário: abaixo de 200 não recebe desconto', () => {
  assert.equal(automaticDiscount(199.99), 0);
});

test('unitário: exatamente 200 recebe 10% de desconto', () => {
  assert.equal(automaticDiscount(200), 20);
});

test('unitário: quantidade zero é inválida', () => {
  assert.equal(validateQuantity(0).ok, false);
});

test('unitário: meio centavo arredonda para cima', () => {
  assert.equal(percentOf(200.05, 10), 20.01);
});





test('funcional: compra de 2 produtos de 100 cobra frete', () => {
  const r = cotar(100, 2);

  assert.equal(r.ok, true);
  assert.equal(r.subtotal, 200);
  assert.equal(r.shipping, 18.5);
  assert.equal(r.total, 198.5);
});

test('funcional: compra de 3 produtos de 100 tem frete grátis', () => {
  const r = cotar(100, 3);

  assert.equal(r.ok, true);
  assert.equal(r.subtotal, 300);
  assert.equal(r.discount, 30);
  assert.equal(r.shipping, 0);
  assert.equal(r.total, 270);
});

test('funcional: compra de 2 produtos de 100.01 fica abaixo de 300 e paga frete', () => {
  const r = cotar(100.01, 2);

  assert.equal(r.ok, true);
  assert.equal(r.subtotal, 200.02);
  assert.equal(r.shipping, 18.5);
  assert.equal(r.total, 198.52);
});

test('funcional: compra de 1 produto de 100 paga frete', () => { const r = cotar(100);

assert.equal(r.ok, true); 
assert.equal(r.subtotal, 100); 
assert.equal(r.discount, 0); 
assert.equal(r.shipping, 18.5); 
assert.equal(r.total, 118.5); });

test('funcional: compra de 3 produtos de 100.01 tem frete grátis', () => { const r = cotar(100.01, 3);

assert.equal(r.ok, true); 
assert.equal(r.subtotal, 300.03);
assert.equal(r.discount, 30);
assert.equal(r.shipping, 0);
assert.equal(r.total, 270.03); });

test('funcional: compra de 2 produtos de 200 recebe desconto e paga frete', () => { const r = cotar(200, 2);

assert.equal(r.ok, true);
assert.equal(r.subtotal, 400);
assert.equal(r.discount, 40);
assert.equal(r.shipping, 0);
assert.equal(r.total, 360); });

test('funcional: compra de 1 produto de 250 recebe desconto e paga frete', () => { const r = cotar(250);

assert.equal(r.ok, true);
assert.equal(r.subtotal, 250);
assert.equal(r.discount, 25);
assert.equal(r.shipping, 18.5);
assert.equal(r.total, 243.5); });

test('funcional: compra de produto de 200 recebe desconto e frete', () => {
  const r = cotar(200);

  assert.equal(r.ok, true);
  assert.equal(r.subtotal, 200);
  assert.equal(r.discount, 20);
  assert.equal(r.shipping, 18.5);
  assert.equal(r.total, 198.5);
});
