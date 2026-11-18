# Loja Aurora

Loja Aurora é uma aplicação de e-commerce local usada para praticar qualidade e teste de software. O projeto permite explorar fluxos de clientes e administradores, regras de compra e persistência de pedidos com dados fictícios.

## O que é possível testar

- Cadastro, login e logout de clientes
- Catálogo, busca, filtros e carrinho
- Estoque, cupons, descontos, frete e finalização de pedidos
- Histórico de pedidos e permissões de cliente e administrador
- Testes unitários, de integração, de interface, acessibilidade, carga e estresse

## Tecnologias

- Interface: HTML, CSS e JavaScript
- Servidor: Node.js 18 ou superior, usando módulos nativos
- Persistência: arquivo JSON local
- Testes: `node:test`, Playwright e k6

## Executar a aplicação

Instale o [Node.js 18 ou superior](https://nodejs.org/) e abra a pasta do projeto no terminal.

```bash
npm run reset
npm start
```

Abra <http://127.0.0.1:3000>. Para encerrar o servidor, pressione `Ctrl+C` no terminal.

`npm run reset` recria a base de teste e substitui os cadastros e pedidos locais. Pare o servidor antes de executar o reset. A aplicação usa módulos nativos do Node.js; não é necessário instalar dependências para iniciar apenas o servidor.

## Executar os testes

### Testes Node.js

```bash
npm test
```

Esse comando executa os arquivos `*.test.js` em `tests/`, incluindo as subpastas `unit/` e `integration/`.

### Testes de interface com Playwright

Instale as dependências de desenvolvimento e o navegador Chromium uma vez:

```bash
npm install
npx playwright install chromium
```

Depois, execute:

```bash
npx playwright test
```

O relatório HTML é salvo em `reports/playwright-report/`.

### Testes de carga e estresse com k6

Os scripts usam a porta `3001`. Em um terminal PowerShell, inicie o servidor nessa porta:

```powershell
$env:PORT=3001
npm start
```

Em outro terminal, execute os cenários:

```bash
k6 run tests/carga/carga.js
k6 run tests/carga/estresse.js
```

A carga cresce até 5 usuários virtuais. O estresse cresce em etapas até 15 usuários virtuais e depois reduz a carga. Os resultados aparecem no terminal. Execute esses cenários apenas na aplicação local ou em ambiente autorizado.

## Contas e dados de teste

As contas abaixo são fictícias e existem para a prática:

| E-mail | Senha | Perfil |
| --- | --- | --- |
| `cliente-a@loja.test` | `SenhaDidatica123!` | Cliente |
| `cliente-b@loja.test` | `SenhaDidatica123!` | Cliente |
| `admin@loja.test` | `SenhaDidatica123!` | Administrador |

Fixtures úteis:

- `produto-teste`: R$ 150,00, estoque 5
- `ANTIGO`: cupom vencido
- `VINTE`: cupom de 20%, válido até 31/12/2026
- `CINCO`: cupom de 5%, válido até 31/12/2026

`npm run reset` restaura os dados iniciais descritos em `data/dataset_loja_6000.json` e recria `data/db.json`.

## Estrutura do projeto

```text
public/       interface web
src/domain/   regras de negócio
src/routes/   rotas da API
src/services/ operações de checkout e histórico
src/persistence/ acesso aos dados JSON
data/         dataset e base local
tests/       testes automatizados e cenários k6
```

Os requisitos funcionais e de qualidade estão em [REQUISITOS.md](REQUISITOS.md). A base local usa dados didáticos; não a exponha como serviço público.
