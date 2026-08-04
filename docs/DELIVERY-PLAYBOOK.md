# Playbook de entrega do Ceasaminas Digital

Este playbook converte especialidades complementares em um único processo de construção para o
portal institucional, o painel administrativo e a API. Ele não adiciona agentes em produção nem
envia dados do projeto a serviços de IA.

## Perspectivas usadas em cada entrega

| Perspectiva             | Pergunta de controle                                                 | Evidência esperada                                |
| ----------------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| Produto e conteúdo      | A mudança resolve uma necessidade real com linguagem pública clara?  | objetivo, público e critério de aceite            |
| UX                      | O caminho principal é compreensível e recuperável quando algo falha? | estados e fluxo documentados                      |
| UI institucional        | A solução é consistente, responsiva e reconhecível como Ceasaminas?  | componentes e tokens reutilizados                 |
| Frontend                | A interface é semântica, acessível e eficiente?                      | teclado, foco, responsividade e ausência de erros |
| Backend e dados         | Contratos, integridade e falhas estão tratados?                      | validação, transação e respostas previsíveis      |
| Segurança e privacidade | O menor privilégio foi aplicado e dados sensíveis estão protegidos?  | autorização no servidor e ausência de segredos    |
| Qualidade               | O comportamento crítico está comprovado e o diff ficou no escopo?    | testes, checks e revisão final                    |

## Sequência de construção

### 1. Descoberta

- Identifique o usuário: cidadão, permissionário, fornecedor, imprensa ou equipe interna.
- Localize implementações e componentes existentes antes de desenhar uma solução nova.
- Liste dependências entre portal, admin, API, Prisma, PostgreSQL, Redis e armazenamento.
- Confirme a fonte do conteúdo institucional; não invente datas, números, contatos ou normas.

Saída mínima: objetivo em uma frase, fluxo principal e riscos conhecidos.

### 2. Contrato da experiência

Defina antes do código:

- hierarquia de informação e ação principal;
- comportamento em telas pequenas, médias e grandes;
- estados de carregamento, vazio, sucesso, erro, indisponibilidade e acesso negado;
- navegação por teclado, ordem de foco e anúncio de mensagens dinâmicas;
- limite de animações e comportamento com movimento reduzido.

### 3. Implementação

- Use Server Components por padrão no Next.js e Client Components somente quando houver interação.
- Mantenha dados e regras de negócio fora de componentes visuais.
- Reutilize contratos tipados e componentes compartilhados do monorepo.
- Defina dimensões de mídia e carregue antecipadamente apenas recursos realmente críticos.
- Na API, valide DTOs, aplique autorização no servidor e preserve atomicidade quando necessário.
- Para mutações, forneça retorno claro ao usuário e impeça duplicidade acidental.

### 4. Revisão inclusiva

Verifique manualmente:

- uso apenas por teclado, inclusive menus, modais, filtros e paginação;
- foco visível e devolvido ao local correto após fechar componentes;
- títulos em ordem lógica, landmarks e nomes acessíveis;
- contraste de texto, controles e estados, inclusive erro e desabilitado;
- zoom de 200%, largura reduzida e conteúdo sem corte ou rolagem bidimensional desnecessária;
- formulários com rótulos, instruções e erros associados aos campos;
- conteúdo compreensível sem depender apenas de cor, ícone, posição ou movimento.

WCAG é o referencial técnico, mas conformidade só deve ser declarada após auditoria apropriada.

### 5. Revisão de risco

- Autenticação: a sessão expira, pode ser revogada e não aparece em logs?
- Autorização: cada operação sensível verifica papel e propriedade no servidor?
- Entrada: dados externos são validados antes de consultas, arquivos ou renderização?
- Privacidade: somente os dados necessários são coletados e retornados?
- Persistência: operações compostas são transacionais e falhas deixam estado consistente?
- Observabilidade: erros são úteis para operação sem revelar segredos ou dados pessoais?

### 6. Gates de entrega

Execute a partir da raiz:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Quando houver fluxo crítico alterado, acrescente o teste automatizado de menor nível que prove o
comportamento e um smoke test do caminho público ou autenticado correspondente.

O resumo da entrega deve informar:

- resultado para o usuário;
- arquivos e contratos afetados;
- checks executados e seus resultados;
- limitações, riscos residuais e próximos passos reais.

## Orçamento de qualidade

Não use metas como alegações sem evidência. Quando a infraestrutura de medição estiver disponível,
acompanhe ao menos Core Web Vitals, erros de cliente, falhas de API e duração dos checks de CI. Uma
regressão mensurável precisa ser corrigida ou aceita explicitamente com justificativa.

## Origem e licença

Este playbook é uma adaptação, para o contexto Ceasaminas Digital, das metodologias especializadas
do projeto [Agency Agents](https://github.com/msitarzewski/agency-agents), particularmente das áreas
de frontend, UI, UX, acessibilidade, arquitetura, segurança e revisão. O projeto original é
distribuído sob a [licença MIT](https://github.com/msitarzewski/agency-agents/blob/main/LICENSE),
Copyright (c) 2025 AgentLand Contributors.
