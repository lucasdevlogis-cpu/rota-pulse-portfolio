# publicacao segura no GitHub

## objetivo

Evitar que o portfolio publique segredo, ruido operacional ou frente fora do foco local.

## antes de publicar

```powershell
powershell -ExecutionPolicy Bypass -File tools/security/check-publication-safety.ps1
git status --short --branch
git diff --check
git diff --name-only -- .upstream
```

Se for publicar uma versao validada da demo:

```powershell
powershell -ExecutionPolicy Bypass -File tools/smoke/smoke-official.ps1
npm --prefix tests/e2e run smoke
```

Para portfolio publico, preferir repositorio novo ou historia limpa/squashed. Nao publicar historico operacional antigo se ele nao agrega valor ao avaliador.

## nunca versionar

- senha real de producao ou provedor externo;
- token Bearer real;
- chave de API;
- chave privada;
- dump de banco;
- arquivo externo de secrets;
- payload operacional sensivel.

Credenciais locais descartaveis sao aceitaveis apenas quando nao abrem ambiente externo.

## historico Git

Remover segredo do arquivo atual nao limpa commits antigos. Se segredo real entrou no historico, publicar com seguranca exige uma destas rotas:

- rotacionar ou resetar o segredo antes de publicar;
- publicar uma historia limpa/squashed;
- manter o repositorio privado ate decidir a limpeza.

Nao reescrever historico automaticamente sem tarefa propria.

## regra de portfolio

O repositorio publico deve vender:

- demo local reproduzivel;
- case Brasil;
- seed;
- testes fundamentais;
- disciplina upstream-first.

Nao deve vender:

- ambiente permanente em provedor externo pago como requisito;
- historico operacional interno;
- promessa de mobile, extensao nativa ou roteirizacao proprietaria.
