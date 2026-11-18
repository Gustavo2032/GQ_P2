# Aula 1 — Unitário e funcional na Loja Aurora

## Ambiente real do projeto
Abrir no VS Code a pasta **alunos**, onde estão `package.json`, `server.js` e `src`. A loja usa CommonJS (`require`). Os módulos recebem valores em **reais**, não centavos. O dataset tem centavos, mas o seed faz a conversão.

Executar na raiz `alunos`:
```bash
npm run reset
npm start
```
Pare o servidor antes do reset; ele apaga as compras da prática e recria a base didática. Inicie novamente. Use um segundo terminal para os testes. Cada dupla usa sua cópia local. Endereço: `http://127.0.0.1:3000`. Para Node.js, use uma versão LTS atual compatível com o projeto (>=18).

Conta local: `cliente-a@loja.test` / `SenhaDidatica123!`. Produto `produto-teste`: R$ 150 e estoque 5. Interface em `/#entrar`, `/#catalogo`, `/#carrinho`, `/#pedidos` e `/#cadastro`.

Referência: `REQUISITOS.md` do projeto. **Novas compras: frete R$ 18,50 abaixo de R$ 300; a partir de R$ 300, frete zero, antes dos descontos.** Pedidos históricos do dataset podem ter frete R$ 20; não recalcular esses snapshots.

## Objetivo
Testar funções isoladas e regras da cotação. Um teste pode ser simultaneamente unitário (nível) e funcional (foco). Leia RN-01, RN-02, RN-03 e RN-06.

## Preparação específica
Os exemplos abaixo não exigem servidor nem reset: importam funções puras. Criar o arquivo exatamente no caminho indicado. `npm test` descobre arquivos `.test.js` diretamente em `tests`; também é possível executar somente esta aula.

### Arquivo `tests/aula01.test.js`
```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const { automaticDiscount } = require('../src/domain/discount');
const { validateQuantity } = require('../src/domain/quantity');
const { quoteLines } = require('../src/domain/pricing');
const { percentOf } = require('../src/domain/money');
function cotar(preco, quantidade = 1) {
  return quoteLines({lines:[{productId:'produto-teste',name:'Produto Teste',unitPrice:preco,quantity:quantidade}]});
}
test('unitário: abaixo de 200 não há desconto', () => {
  assert.equal(automaticDiscount(199.99), 0);
});


test('unitário: exatamente 200 recebe 10%', () => {
  assert.equal(automaticDiscount(200), 20);
});



test('unitário: quantidade negativa é inválida', () => {
  assert.equal(validateQuantity(-1).ok, false);
});


test('unitário: meio centavo arredonda para cima', () => {
  assert.equal(percentOf(200.05,10), 20.01);
});


test('funcional: compra de 300 tem desconto e frete grátis', () => {
  const r = cotar(150,2);
  assert.equal(r.ok,true);
  assert.equal(r.subtotal,300);
  assert.equal(r.discount,30);
  assert.equal(r.shipping,0);
  assert.equal(r.total,270);
});


test('funcional: abaixo de 300 frete custa 18,50', () => {
  const r = cotar(100);
  assert.equal(r.ok,true);
  assert.equal(r.shipping,18.5);
  assert.equal(r.total,118.5);
});
```

## Executar
```bash
node --test tests/aula01.test.js
```
## Explicação do código
`test` cria casos; `assert.equal` compara esperado e obtido. `automaticDiscount` retorna valor em reais. `validateQuantity` retorna objeto com `ok`. `quoteLines` recebe `lines`, não `itens`; cada linha usa `unitPrice`, `quantity`, `name` e `productId`. A cotação retorna `ok`, `subtotal`, `discount`, `shipping`, `total`.

R$ 200,05 × 10% = R$ 20,005; half-up exige R$ 20,01. O teste de quantidade é da validação: estoque será verificado nas aulas de integração.

Uma falha interrompe o caso na primeira asserção, mas os outros casos continuam. Se necessário, dividir a cotação em testes separados para analisar frete e total independentemente.

## Desafios
Adicionar limite R$ 200,01, frete em R$ 299,99, quantidade zero/fracionária e percentuais com centavos. Investigar antes de corrigir. O código do teste não deve conter uma versão substituta da função real.

Referência: [Node.js test runner](https://nodejs.org/api/test.html).

## Dinâmica e entrega
Sugestão para 100 minutos: 10 de abertura, 15 de demonstração, 50 de prática, 15 de investigação/correção e 10 de discussão. Trabalhar em dupla e alternar quem executa e quem registra.

Ler requisito → definir esperado → executar → registrar → investigar → corrigir → reexecutar. Não alterar o resultado esperado para fazer um defeito passar. Erro de instalação/importação é bloqueio de ambiente; distinguir de violação do requisito. Guardar evidências antes e depois, sem apagar casos reprovados.

Entregar pelo menos quatro casos (dois por abordagem), código, tabela de resultados e conclusão. Se houver defeito confirmado, incluir relato com versão, pré-condições, passos, esperado, obtido e impacto.

| Caso | Requisito | Entrada/ação | Esperado | Obtido | Situação | Evidência |
|---|---|---|---|---|---|---|
| CT01 | Informar | Informar | Conforme requisito | Após executar | Aprovado/Reprovado/Bloqueado | Arquivo/captura |