# Aula 4 — Usabilidade e acessibilidade na Loja Aurora

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
RNF-01 a RNF-05. Avaliar execução de tarefas e barreiras de teclado/rótulos. Teste automático é apoio; aprovação não certifica acessibilidade completa.

## Preparação do navegador automatizado
Instalar uma vez na raiz `alunos`, sem substituir `package.json`:
```bash
npm install -D @playwright/test
npx playwright install chromium
```
Criar `playwright.config.cjs` na raiz (conteúdo abaixo). Os testes de interface ficam em `tests/interface` para não entrar no comando `npm test` do projeto. O servidor deve estar aberto em outro terminal.

### Arquivo `playwright.config.cjs`
```javascript
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir:'./tests/interface',workers:1,
  use:{baseURL:process.env.BASE_URL || 'http://127.0.0.1:3000',trace:'retain-on-failure'},
  reporter:[['list'],['html',{open:'never'}]]
});
```

Instalar também:
```bash
npm install -D @axe-core/playwright
```

### Arquivo `tests/interface/aula04.spec.cjs`
```javascript
const { test,expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
test('acessibilidade: cadastro sem violações automatizadas detectadas', async ({page}) => {
  await page.goto('/#cadastro');
  await expect(page.locator('#view-register')).toBeVisible();
  const resultado = await new AxeBuilder({page}).analyze();
  expect(resultado.violations).toEqual([]);
});
test('acessibilidade: Nome possui rótulo associado', async ({page}) => {
  await page.goto('/#cadastro');
  await expect(page.locator('#view-register')).toBeVisible();
  await expect(page.locator('#register-form').getByLabel('Nome',{exact:true})).toBeVisible();
});
test('acessibilidade: adicionar produto pode receber foco por Tab', async ({page}) => {
  await page.goto('/#catalogo');
  const alvo = page.locator('[data-testid="add-to-cart"][data-product-id="produto-teste"]');
  await expect(alvo).toBeVisible();
  await page.locator('#refresh-catalog').focus();
  await page.keyboard.press('Tab');
  await expect(alvo).toBeFocused();
});
```

## Executar
```bash
npx playwright test aula04.spec.cjs
npx playwright show-report
```
## Explicação
`getByLabel` verifica associação real entre rótulo e campo. Não substituir por ID para fazer esse caso passar. O teste de Tab começa no botão Atualizar lista e verifica o primeiro produto do seed. Sem alterar ordem do catálogo, produto-teste é o primeiro. Se o catálogo for reordenado, ajustar a pré-condição, não obrigar foco em um produto que não é o seguinte.

Axe considera o estado visível da página; avaliar também erros e carrinho. Navegação por teclado inteira precisa ser feita manualmente: o teste de Tab cobre só um trecho.

## Usabilidade por observação
Pessoa A tenta cadastrar-se, encontrar Produto Teste, adicioná-lo, aplicar VINTE e descobrir total. Pessoa B observa sem orientar. Trocar papéis e usar conta fictícia de cadastro com e-mail único; não cadastrar novamente um e-mail já existente.

| Tarefa | Concluiu sem ajuda? | Tempo | Tentativas | Dificuldade observada |
|---|---|---|---|---|
| Cadastro | Registrar | Registrar | Registrar | Registrar |
| Produto/carrinho/cupom | Registrar | Registrar | Registrar | Registrar |

Critérios: conclusão sem ajuda, clareza dos erros, compreensão do total. Tempo é indicador, não limite universal. Não generalizar observações de duas pessoas para toda população.

## Roteiro manual
Tab/Shift+Tab/Enter/Escape; foco visível; aplicar cupom sem mouse; mensagens indicando campo inválido; zoom 200%; carrinho vazio com orientação. Testar leitor de tela se disponível e identificar a ferramenta. Registrar usabilidade separadamente das violações automatizadas.

Referência: [Playwright — acessibilidade](https://playwright.dev/docs/accessibility-testing).

## Dinâmica e entrega
Sugestão para 100 minutos: 10 de abertura, 15 de demonstração, 50 de prática, 15 de investigação/correção e 10 de discussão. Trabalhar em dupla e alternar quem executa e quem registra.

Ler requisito → definir esperado → executar → registrar → investigar → corrigir → reexecutar. Não alterar o resultado esperado para fazer um defeito passar. Erro de instalação/importação é bloqueio de ambiente; distinguir de violação do requisito. Guardar evidências antes e depois, sem apagar casos reprovados.

Entregar pelo menos quatro casos (dois por abordagem), código, tabela de resultados e conclusão. Se houver defeito confirmado, incluir relato com versão, pré-condições, passos, esperado, obtido e impacto.

| Caso | Requisito | Entrada/ação | Esperado | Obtido | Situação | Evidência |
|---|---|---|---|---|---|---|
| CT01 | Informar | Informar | Conforme requisito | Após executar | Aprovado/Reprovado/Bloqueado | Arquivo/captura |