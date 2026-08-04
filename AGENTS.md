# Diretrizes de entrega — Ceasaminas Digital

Estas instruções se aplicam a todo o monorepo. Antes de alterar uma área, leia também as
orientações específicas existentes no diretório mais próximo.

## Princípios

- Preserve funcionalidades existentes e prefira mudanças pequenas, reversíveis e bem delimitadas.
- Entregue código funcional; não deixe telas fictícias, dados inventados ou ações sem efeito.
- Reutilize os pacotes do workspace antes de criar implementações locais duplicadas.
- Trate acessibilidade, desempenho, segurança e responsividade como requisitos de aceite.
- Registre suposições e diferencie fatos verificados de recomendações.

## Fluxo obrigatório

1. Entenda o fluxo afetado no portal, admin, API, banco e pacotes compartilhados.
2. Defina o resultado esperado e os estados de carregamento, vazio, sucesso, erro e permissão.
3. Implemente mobile-first, com HTML semântico e navegação completa por teclado.
4. Valide contratos da API, autorização, dados pessoais e efeitos colaterais.
5. Execute `pnpm format:check`, `pnpm lint`, `pnpm typecheck` e `pnpm build`.
6. Faça uma revisão final do diff e informe limitações ou checks não executados.

## Disciplina de execução

- Trate o resultado final como responsabilidade da equipe, incluindo consequências de segunda ordem.
- Questione premissas frágeis com evidência e proponha uma alternativa melhor quando necessário.
- Quando a demanda for recorrente, entregue a solução específica e transforme o padrão em teste,
  script, componente, checklist ou documentação reutilizável.
- Não adivinhe silenciosamente: esclareça ambiguidades materiais ou declare a suposição adotada.
- Defina critérios de sucesso antes de implementar e verifique cada critério antes da entrega.
- Para decisões sem resposta óbvia, estabeleça primeiro o princípio técnico e depois aplique ao caso.
- Verifique fatos, versões, números e afirmações suscetíveis a mudança em fontes primárias.
- Comunique incerteza de forma objetiva e nunca fabrique uma resposta plausível para ocultá-la.

## Critérios para interfaces

- Preserve a identidade institucional da Ceasaminas e a consistência entre páginas.
- Use componentes de `packages/ui` quando forem adequados e extraia padrões realmente repetidos.
- Garanta foco visível, contraste suficiente, rótulos claros e suporte a leitores de tela.
- Respeite `prefers-reduced-motion`; animação deve explicar estado ou hierarquia.
- Evite mudanças de layout, imagens sem dimensões e JavaScript desnecessário no carregamento inicial.
- Não declare conformidade, métricas Lighthouse ou ganhos percentuais sem medição verificável.

## Critérios para API e dados

- Valide entradas na fronteira, mantenha respostas previsíveis e não exponha dados sensíveis.
- Aplique autenticação e autorização no servidor; a interface nunca é a barreira de segurança.
- Use transações para operações que precisam ser atômicas e torne reexecuções seguras quando possível.
- Preserve compatibilidade ou documente explicitamente qualquer alteração de contrato.
- Nunca grave segredos, senhas, tokens ou dados pessoais em código, logs ou comandos versionados.

## Referência metodológica

O processo detalhado está em `docs/DELIVERY-PLAYBOOK.md`. Ele adapta práticas do projeto
[Agency Agents](https://github.com/msitarzewski/agency-agents), distribuído sob licença MIT.
As regras complementares de execução estão em `docs/ADAPTA-GUIDELINES.md`.
