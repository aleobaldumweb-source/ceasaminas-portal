# Checklist de homologação de produção

Este checklist registra a evidência necessária para declarar o Ceasaminas Digital apto ao uso em
produção. Marque um item somente depois de executar a verificação no ambiente real e registrar data,
responsável, resultado e referência da evidência no relatório de mudança da operação.

## Gate de código e entrega

- [ ] Pull request integrado à `main` com a CI verde no commit implantado.
- [ ] Formatação, lint, tipos, testes de API, E2E, Lighthouse e builds Docker concluídos pela CI.
- [ ] Imagens implantadas correspondem ao SHA aprovado, sem alterações locais no servidor.
- [ ] Migrações aplicadas e serviços reportados como saudáveis pelo Compose.

## Acesso público e segurança

- [ ] DNS do portal, admin e API aponta para o servidor de produção.
- [ ] HTTPS válido nos três domínios, redirecionamento HTTP ativo e renovação TLS monitorada.
- [ ] Origens CORS e URLs públicas conferidas sem curingas indevidos.
- [ ] Conta administrativa local de contingência criada e guardada conforme a política institucional.
- [ ] Segredos possuem ao menos 32 caracteres, não estão no Git e têm acesso restrito.

## Autenticação e comunicação

- [ ] Login LDAPS validado com cada grupo autorizado.
- [ ] Usuário sem grupo, credencial inválida e indisponibilidade do AD produzem falhas seguras.
- [ ] Remoção de grupo revoga o próximo acesso conforme o comportamento aprovado.
- [ ] Recuperação de senha chega à conta de teste pelo SMTP oficial.
- [ ] Link de recuperação expira, só pode ser usado uma vez e aponta para o domínio HTTPS correto.

## Dados, arquivos e continuidade

- [ ] Backup gera os artefatos de PostgreSQL e uploads no destino externo criptografado.
- [ ] Retenção de 30 dias e execução automática do timer foram verificadas.
- [ ] Restauração completa foi ensaiada em ambiente isolado e o tempo de recuperação foi registrado.
- [ ] Notícias, mercado, licitações, transparência e arquivos foram conferidos após a restauração.

## Observabilidade e capacidade

- [ ] Monitor de saúde executa a cada cinco minutos e alerta após três falhas consecutivas.
- [ ] Alerta de disco dispara no limite configurado e o evento de recuperação também é entregue.
- [ ] Logs são enviados para armazenamento externo com retenção definida e sem dados sensíveis.
- [ ] Alertas de TLS, HTTP 5xx, latência e falhas de autenticação chegam ao plantão responsável.
- [ ] Teste de capacidade representa a carga esperada e não viola os limites aprovados.

## Experiência e aceite funcional

- [ ] Lighthouse foi executado nas URLs públicas e respeitou os orçamentos do runbook.
- [ ] Fluxos públicos foram validados em desktop e celular, por teclado e com zoom de 200%.
- [ ] CRUDs de notícias, usuários, mercado, licitações e transparência foram validados por perfil.
- [ ] Estados de carregamento, vazio, sucesso, erro e acesso negado foram conferidos.
- [ ] Conteúdo institucional, contatos, links e documentos receberam aprovação da área responsável.

## Aprovação

- [ ] Responsável técnico aprovou o relatório e os riscos residuais.
- [ ] Operação confirmou backup, alertas, acesso e procedimento de reversão.
- [ ] Área de negócio aceitou conteúdo e fluxos críticos.
- [ ] Data e janela de publicação foram registradas.

Nenhuma automação local substitui estas evidências. Falha em segurança, integridade, recuperação ou
alertas bloqueia a publicação; demais exceções precisam de aceite explícito, prazo e responsável.
