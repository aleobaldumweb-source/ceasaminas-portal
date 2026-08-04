# Diretrizes de execução inspiradas no Gabarito ADAPTA

Este documento registra uma adaptação original, para o Ceasaminas Digital, dos conceitos presentes
no [PDF Gabarito ADAPTA](references/adapta-pdf-gabarito.pdf), fornecido e autorizado para inclusão
pelo responsável do projeto. O documento original permanece disponível como referência; estas
diretrizes traduzem seus conceitos para o contexto técnico do monorepo.

## Aplicação no projeto

### Responsabilidade pelo resultado

Uma entrega termina quando o resultado esperado foi comprovado, não quando o primeiro código foi
escrito. Antes de modificar o sistema, considere integrações afetadas, operação futura, segurança,
manutenção e impacto sobre cidadãos e equipes internas.

### Independência técnica

Decisões devem favorecer o objetivo do produto. Quando uma solicitação introduzir regressão,
duplicação, risco ou premissa incorreta, registre a evidência, explique o efeito e proponha a menor
alternativa que preserve a intenção.

### Sistematização

Problemas recorrentes devem produzir ativos reutilizáveis. Conforme o caso, transforme a solução em
componente compartilhado, script seguro, teste automatizado, regra de CI, checklist ou documentação.

### Clareza antes da execução

Não escolha silenciosamente entre interpretações capazes de gerar resultados materialmente
diferentes. Faça uma pergunta crítica quando depender de informação exclusiva do responsável ou
declare a suposição quando ela puder ser verificada e revertida com baixo risco.

### Elevação da especificação

Pedidos curtos ainda exigem definição de usuário, problema, restrições e resultado. Para diagnóstico,
separe sintoma de causa. Para decisão, compare alternativas por critérios. Para implementação,
identifique dependências e ordem de execução.

### Critérios e autoverificação

Defina critérios observáveis antes de implementar. Ao finalizar, valide comportamento, formatação,
lint, tipos, build, estados de interface, acessibilidade e segurança na proporção do risco. Informe
qualquer etapa que não pôde ser executada.

### Princípios antes de soluções

Em problemas com múltiplas abordagens, registre primeiro o princípio arquitetural relevante, como
menor privilégio, fonte única de verdade, mudança mínima ou degradação graciosa. A implementação deve
ser justificável por esse princípio e pelo contexto concreto.

### Verificação factual

Versões, normas, datas, métricas, contratos externos e detalhes institucionais precisam ser
confirmados em fonte primária quando puderem ter mudado. Conteúdo público nunca deve ser inventado
para completar uma interface.

### Confiança calibrada

Diferencie resultado testado, inferência e hipótese. Quando uma limitação de ambiente impedir a
verificação, descreva exatamente o bloqueio e forneça o comando ou evidência necessária para fechar
a validação.

### Refinamento do pedido

Quando uma especificação ampla puder ser tornada executável sem informação adicional, registre uma
versão operacional com escopo, público, resultado esperado e critério de aceite. Evite refinamentos
cosméticos que não alterem a qualidade da entrega.

## Relação com o playbook

Estas diretrizes complementam `docs/DELIVERY-PLAYBOOK.md`. O playbook define as perspectivas e os
gates de construção; este documento define a disciplina de raciocínio e verificação aplicada antes,
durante e depois de cada mudança.
