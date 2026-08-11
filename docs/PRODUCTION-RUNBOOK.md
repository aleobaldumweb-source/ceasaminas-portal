# Operação em produção

## Pré-requisitos

- servidor Linux com Docker Engine e Compose;
- DNS dos domínios do portal, admin e API apontando para o servidor;
- portas 80 e 443 liberadas;
- armazenamento externo e criptografado para cópias de segurança.

Copie `deploy/.env.production.example` para `deploy/.env.production`, preencha os segredos e
mantenha o arquivo fora do Git. Use valores aleatórios com pelo menos 32 caracteres para os segredos
JWT e restrinja o acesso ao arquivo a administradores do servidor.

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_SECURE` e, quando exigidos pelo provedor,
`SMTP_USER` e `SMTP_PASSWORD`. `ADMIN_PUBLIC_URL` deve apontar para a origem HTTPS pública do admin,
pois ela é usada para gerar o link de redefinição de senha. Antes da publicação, envie uma
recuperação para uma conta de teste e confirme entrega, expiração e uso único do link.

## Primeira publicação

```powershell
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml build
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml --profile tools run --rm migrate
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml up -d
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml ps
```

O Caddy solicita e renova certificados TLS automaticamente. A API não publica Swagger em produção,
PostgreSQL e Redis não expõem portas ao host, e os serviços possuem sondas de saúde.

## Atualização e reversão

Antes de atualizar, gere backup. Construa as imagens, execute as migrações e só então substitua os
serviços. Migrações devem ser compatíveis com a versão anterior durante a janela de implantação; uma
reversão de aplicação não desfaz dados automaticamente.

```powershell
.\scripts\backup-production.ps1 -Destination D:\backups\ceasaminas
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml build
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml --profile tools run --rm migrate
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml up -d
```

## Backup e restauração

Agende `backup-production.ps1` diariamente e copie os artefatos para outro local. O padrão conserva
30 dias. Teste a restauração em ambiente isolado pelo menos uma vez por trimestre. Nunca restaure
sobre produção sem janela aprovada e backup imediatamente anterior.

O script de restauração exige os dois artefatos do mesmo ciclo e uma confirmação explícita. Ele
valida os arquivos, interrompe a API, substitui o banco e os uploads e reinicia o serviço. Execute-o
somente durante uma janela aprovada:

```powershell
.\scripts\restore-production.ps1 `
  -DatabaseBackup D:\backups\ceasaminas\postgres-20260811-020000.dump `
  -UploadsBackup D:\backups\ceasaminas\uploads-20260811-020000.tar.gz `
  -ConfirmDataReplacement
```

Depois, confirme `/api/v1/health`, autenticação, notícias, licitações, transparência e arquivos. Em
um teste trimestral, use uma cópia isolada do ambiente e registre duração, resultado e responsável.

## Monitoramento mínimo

- consultar `/api/v1/health/live` para processo e `/api/v1/health` para PostgreSQL, Redis e uploads;
- alertar após três falhas consecutivas ou uso de disco acima de 80%;
- coletar logs do Docker fora do servidor e configurar retenção;
- monitorar validade TLS, erros HTTP 5xx, latência e falhas de autenticação;
- não registrar tokens, senhas, cookies ou conteúdo pessoal.

Em produção, a API emite logs JSON e devolve `x-request-id` em todas as respostas. O proxy ou o
coletor pode fornecer esse cabeçalho; valores inválidos são substituídos. Os registros HTTP incluem
somente método, caminho sem query string, status e duração, evitando cookies, tokens, corpo, IP e
parâmetros potencialmente pessoais.

O Compose aplica rotação local a todos os contêineres, limitando cada arquivo a 10 MB e mantendo
cinco arquivos por serviço. Isso protege o disco, mas não substitui o envio para um coletor externo
com retenção e alertas definidos pela operação.

Este repositório prepara os serviços, mas a validação de DNS, certificados, restauração, alertas e
capacidade depende do ambiente real e deve ser registrada durante a homologação.

## Orçamento de desempenho

Execute `pnpm test:performance` após o build. O Lighthouse CI mede início, institucional e contato
em modo desktop e exige desempenho mínimo de 80, acessibilidade de 95, boas práticas e SEO de 90,
LCP de até 3 segundos, CLS de até 0,1 e TBT de até 300 ms. A CI aplica os mesmos limites. Esses
resultados locais detectam regressões, mas a homologação final deve ser repetida na URL pública com
rede e infraestrutura reais.
