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

## Active Directory

O login pode autenticar usuários no Active Directory via LDAPS, mantendo papel, sessões e auditoria
no PostgreSQL. Configure uma conta de serviço somente leitura, a base de busca e os grupos associados
a `ADMIN`, `EDITOR`, `JOURNALIST` e `AUDITOR`. Em produção, `AD_URL` deve usar `ldaps://`.

Usuários fora dos grupos configurados são recusados. A senha do domínio não é armazenada e contas
do diretório não usam recuperação de senha local. Mantenha ao menos uma conta `LOCAL` administrativa
como contingência e valide cadeia TLS, login, remoção de grupo e indisponibilidade do AD antes do go-live.

Antes do primeiro deploy no Ubuntu, valide arquivo, segredos, Docker, Compose, portas e renderização
da stack. O preflight não envia dados nem inicia serviços:

```bash
./scripts/preflight-production.sh
```

## Primeira publicação

No Ubuntu Server, execute a sequência completa com espera pelas sondas de saúde:

```bash
./scripts/deploy-production.sh
```

O script interrompe imediatamente em caso de falha no preflight, build, banco, migrations ou saúde
dos serviços. Use `--skip-build` somente quando as imagens locais já tiverem sido construídas e
validadas para o mesmo commit.

Os comandos equivalentes para execução manual são:

```powershell
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml build
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml --profile tools run --rm migrate
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml up -d
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml ps
```

O Caddy solicita e renova certificados TLS automaticamente. A API não publica Swagger em produção,
PostgreSQL e Redis não expõem portas ao host, e os serviços possuem sondas de saúde.

Quando o DNS já estiver propagado e o Caddy tiver emitido os certificados, execute o gate público:

```bash
./scripts/verify-production.sh
```

Ele exige HTTP 200 por HTTPS no portal, login do admin e sondas da API, além de confirmar
PostgreSQL, Redis e uploads como saudáveis.

## Atualização e reversão

Antes de atualizar, gere backup. Construa as imagens, execute as migrações e só então substitua os
serviços. Migrações devem ser compatíveis com a versão anterior durante a janela de implantação; uma
reversão de aplicação não desfaz dados automaticamente.

No Ubuntu, automatize a sequência completa informando um destino externo ou sincronizado de backup:

```bash
./scripts/update-production.sh --backup-dir /var/backups/ceasaminas
```

O script só prossegue após criar os dois artefatos de backup e termina executando a verificação
pública. `--skip-public-verify` deve ser usado apenas quando DNS/HTTPS ainda não estiver disponível.

```powershell
.\scripts\backup-production.ps1 -Destination D:\backups\ceasaminas
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml build
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml --profile tools run --rm migrate
docker compose --env-file deploy/.env.production -f deploy/compose.production.yml up -d
```

No Ubuntu Server, execute o equivalente Bash a partir da raiz do repositório:

```bash
./scripts/backup-production.sh /var/backups/ceasaminas
```

## Backup e restauração

Agende `backup-production.ps1` diariamente e copie os artefatos para outro local. O padrão conserva
30 dias. Teste a restauração em ambiente isolado pelo menos uma vez por trimestre. Nunca restaure
sobre produção sem janela aprovada e backup imediatamente anterior.

No Ubuntu, instale o timer diário das 02h informando caminhos absolutos:

```bash
sudo ./scripts/install-backup-timer.sh \
  --project-dir /opt/ceasaminas \
  --backup-dir /var/backups/ceasaminas
sudo systemctl start ceasaminas-backup.service
sudo journalctl -u ceasaminas-backup.service --since today
```

O timer usa atraso aleatório de até 15 minutos, recupera uma execução perdida após reinicialização e
mantém a configuração em `/etc/ceasaminas/backup.conf` com permissão `0600`. O destino ainda deve
ser copiado ou sincronizado para armazenamento externo criptografado.

O script de restauração exige os dois artefatos do mesmo ciclo e uma confirmação explícita. Ele
valida os arquivos, interrompe a API, substitui o banco e os uploads e reinicia o serviço. Execute-o
somente durante uma janela aprovada:

```powershell
.\scripts\restore-production.ps1 `
  -DatabaseBackup D:\backups\ceasaminas\postgres-20260811-020000.dump `
  -UploadsBackup D:\backups\ceasaminas\uploads-20260811-020000.tar.gz `
  -ConfirmDataReplacement
```

No Ubuntu Server:

```bash
./scripts/restore-production.sh \
  /var/backups/ceasaminas/postgres-20260811-020000.dump \
  /var/backups/ceasaminas/uploads-20260811-020000.tar.gz \
  --confirm-data-replacement
```

Depois, confirme `/api/v1/health`, autenticação, notícias, licitações, transparência e arquivos. Em
um teste trimestral, use uma cópia isolada do ambiente e registre duração, resultado e responsável.
O fluxo automatizado foi validado em uma stack Docker descartável em 11/08/2026, incluindo as oito
migrations e a recuperação de um arquivo de uploads; isso não substitui o exercício periódico no
ambiente de hospedagem.

## Monitoramento mínimo

Instale o monitor local no Ubuntu depois que DNS e HTTPS estiverem funcionais:

```bash
sudo ./scripts/install-monitor-timer.sh --project-dir /opt/ceasaminas
sudo systemctl start ceasaminas-monitor.service
sudo journalctl -u ceasaminas-monitor.service --since today
```

O timer executa a cada cinco minutos, sinaliza falha após três verificações públicas consecutivas e
falha imediatamente com uso de disco a partir de 80%. Estados `CRITICAL` e `RECOVERY` ficam no
journal para integração com o coletor/alerta escolhido pela operação.

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
