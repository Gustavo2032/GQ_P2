# Aula 3 — Confirmação e regressão na Loja Aurora

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

## Objetivo e versão
RN-04 e RN-05. A entrega recebida contém uma versão única; não há atualização B separada. Nesta aula, criar teste reprovado para validade, corrigir a implementação e repetir o mesmo caso (confirmação). Reexecutar casos antes aprovados de benefício e cupom inativo (regressão). Se o professor fornecer outra versão posteriormente, repetir a comparação antes/depois.

## Contratos reais
`evaluateCoupon(coupon)` retorna `{ok,...}`; `quoteLines` aceita `coupon` com `code/type/value/expiresAt/active`. O relógio real do projeto é controlável por `setClock` e `resetClock`. A regra a ser corrigida precisa consultar `now()` desse módulo; apenas fixar o relógio não muda uma função que não o consulta.

### Arquivo `tests/aula03.test.js`
```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateCoupon } = require('../src/domain/coupon');
const { quoteLines } = require('../src/domain/pricing');
const { setClock,resetClock,REFERENCE_INSTANT } = require('../src/domain/clock');
const cupom = (value,expiresAt) => ({code:'TESTE',type:'percent',value,expiresAt,active:true});
function cotar(coupon=null) {
  return quoteLines({lines:[{productId:'produto-teste',name:'Produto Teste',unitPrice:150,quantity:2}],coupon});
}
test('confirmação: cupom vencido é recusado', () => {
  setClock(REFERENCE_INSTANT);
  try {
    assert.equal(evaluateCoupon(cupom(20,'2026-10-06T23:59:59Z')).ok,false);
  } finally {resetClock();}
});
test('regressão: cupom válido de 20% não acumula', () => {
  setClock(REFERENCE_INSTANT);
  try {
    const r = cotar(cupom(20,'2026-12-31T23:59:59Z'));
    assert.equal(r.ok,true);
    assert.equal(r.discount,60);
  } finally {resetClock();}
});
test('regressão: cupom de 5% preserva desconto automático maior', () => {
  const r = cotar(cupom(5,'2099-12-31T23:59:59Z'));
  assert.equal(r.ok,true);
  assert.equal(r.discount,30);
});
test('regressão: cupom inativo continua recusado', () => {
  assert.equal(evaluateCoupon({...cupom(20,'2099-12-31'),active:false}).ok,false);
});
```

## Executar e comparar
```bash
node --test tests/aula03.test.js
```
Salvar o resultado da versão anterior, corrigir a regra e executar de novo. Após reset/reinício do servidor, rodar testes anteriores:
```bash
npm test
```
Se os testes das aulas 2 e 6 já estiverem na pasta `tests`, `npm test` exige servidor ativo e executa casos que alteram dados. Para regressão só das regras puras:
```bash
node --test tests/aula01.test.js tests/aula03.test.js
```

## Explicação
A validade vencida usa data anterior ao relógio de referência. `finally` desfaz o relógio mesmo se a asserção falhar. Os casos de 20%, 5% e cupom inativo verificam comportamentos que devem continuar funcionando. Não classificar uma falha antiga como regressão: comprovar aprovação anterior.

## Desafios
Testar cupom inexistente pela API, cupom válido até fim do dia e cupom de valor fixo superior ao subtotal. Definir timezone para fim do dia com o professor antes de implementar. Guardar versão/commit, resultados antes/depois e correção realizada.

Referência: [Node.js](https://nodejs.org/api/test.html).

## Dinâmica e entrega
Sugestão para 100 minutos: 10 de abertura, 15 de demonstração, 50 de prática, 15 de investigação/correção e 10 de discussão. Trabalhar em dupla e alternar quem executa e quem registra.

Ler requisito → definir esperado → executar → registrar → investigar → corrigir → reexecutar. Não alterar o resultado esperado para fazer um defeito passar. Erro de instalação/importação é bloqueio de ambiente; distinguir de violação do requisito. Guardar evidências antes e depois, sem apagar casos reprovados.

Entregar pelo menos quatro casos (dois por abordagem), código, tabela de resultados e conclusão. Se houver defeito confirmado, incluir relato com versão, pré-condições, passos, esperado, obtido e impacto.

| Caso | Requisito | Entrada/ação | Esperado | Obtido | Situação | Evidência |
|---|---|---|---|---|---|---|
| CT01 | Informar | Informar | Conforme requisito | Após executar | Aprovado/Reprovado/Bloqueado | Arquivo/captura |