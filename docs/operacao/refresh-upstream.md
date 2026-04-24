# refresh do upstream

## objetivo

Atualizar o baseline Fleetbase/FleetOps pinado sem editar `.upstream/` manualmente e sem quebrar a demo local.

## quando usar

Usar apenas quando houver motivo claro:

- corrigir bug upstream que afeta a demo;
- testar nova versao do Fleetbase/FleetOps;
- preparar ciclo de manutencao planejado.

Nao usar como rotina antes de portfolio publico se a demo local ja estiver verde.

## regra central

`upstream.lock` e a entrada de controle. `.upstream/` e espelho derivado.

Nunca editar arquivo dentro de `.upstream/` para corrigir produto local. Ajustes locais ficam em `overrides/`, `tools/`, `tests/` ou `docs/`.

## fluxo seguro

1. Anotar os refs atuais:

```powershell
Get-Content upstream.lock
git -C .upstream/fleetbase rev-parse HEAD
git -C .upstream/fleetops rev-parse HEAD
```

2. Escolher novos commits upstream e atualizar somente `upstream.lock`.
3. Sincronizar espelhos:

```powershell
powershell -ExecutionPolicy Bypass -File tools/sync/sync-upstream-mirror.ps1
```

4. Validar pre-requisitos:

```powershell
powershell -ExecutionPolicy Bypass -File tools/doctor/doctor.ps1
```

5. Subir/rebuildar quando necessario:

```powershell
powershell -ExecutionPolicy Bypass -File tools/bootstrap/start-official-product.ps1 -RunDeploy
```

6. Validar runtime:

```powershell
powershell -ExecutionPolicy Bypass -File tools/smoke/smoke-official.ps1
```

7. Validar demo:

```powershell
node tools/demo/seed-demo-case.js
npm --prefix tests/e2e run smoke
```

8. Confirmar que o espelho ficou limpo:

```powershell
git diff --name-only -- .upstream
powershell -ExecutionPolicy Bypass -File tools/sync/verify-upstream.ps1
git diff --check
```

## rollback

Se a demo quebrar:

1. restaurar os refs anteriores em `upstream.lock`;
2. rodar `tools/sync/sync-upstream-mirror.ps1`;
3. rebuildar se necessario;
4. rodar smoke oficial e E2E;
5. manter o commit fora de `main` ate a demo voltar a passar.

## criterios de aceite

- `upstream.lock` aponta para os refs escolhidos.
- `.upstream/fleetbase` e `.upstream/fleetops` batem com o lock.
- `.upstream/` nao tem diff versionado.
- Smoke oficial passa.
- Demo seed passa.
- E2E fundamental passa.

## status do documento

- estado: ativo
- tipo: runbook operacional derivado
- owner: `docs/operacao/`
