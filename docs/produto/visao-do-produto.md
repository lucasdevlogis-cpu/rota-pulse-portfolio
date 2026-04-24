# visao do produto

## frase de produto

Rota Pulse e uma demo reproduzivel de planejamento operacional e roteirizacao assistida para portfolio de Analista de Transporte, construida sobre Fleetbase/FleetOps.

## problema demonstrado

Um analista precisa organizar demanda, capacidade, agenda e leitura de rota sem construir um TMS do zero. O repositorio prova esse fluxo com software open source, seed reproduzivel, smoke funcional e roteiro de apresentacao.

O problema nao e tecnico apenas. A demonstracao precisa responder:

- qual demanda existe;
- qual recurso atende;
- quando a execucao esta planejada;
- que leitura geografica ajuda a decisao;
- qual risco operacional o analista enxerga;
- qual ajuste deve ser priorizado antes de escalar volume.

## publico

- recrutadores e avaliadores tecnicos;
- gestores de transporte e roteirizacao;
- o proprio autor, para estudo e uso futuro em analises operacionais.

## proposta de valor

- subir ambiente local ou Codespaces sob demanda sem custo recorrente obrigatorio;
- demonstrar pedido, motorista, veiculo, agenda e mapa operacional;
- separar o que e Fleetbase/FleetOps nativo do que e camada local Rota Pulse;
- evitar promessa de otimizacao proprietaria, app mobile ou ambiente permanente antes de necessidade real.

## posicionamento honesto

Rota Pulse nao deve ser apresentado como TMS proprietario completo. A apresentacao correta e:

```text
Uma demo tecnica-operacional sobre Fleetbase/FleetOps para mostrar dominio de transporte, organizacao de operacao e leitura analitica.
```

O valor profissional esta em configurar, reproduzir, validar e explicar a operacao. Isso e mais defensavel do que tentar vender uma plataforma nova sem necessidade.

## blocos da demo

| bloco | pergunta que responde |
|---|---|
| Planejamento operacional | a operacao minima esta preparada? |
| Roteirizacao assistida | o mapa/rota ajuda a ler a execucao? |
| Leitura analitica | qual risco ou ajuste o analista recomendaria? |

## limites atuais

- nao ha producao real obrigatoria;
- nao ha app mobile;
- nao ha motor proprio de otimizacao;
- nao ha redesign completo;
- nao ha Storefront, tracker publico, pagamentos ou fluxo comercial;
- nao ha compromisso de cobrir todo o upstream com E2E.

## fontes relacionadas

- [escopo do MVP](escopo-do-mvp.md)
- [case Brasil](case-brasil-planejamento-roteirizacao.md)
- [demo Codespaces](../operacao/demo-codespaces.md)
- [demo local](../operacao/demo-local-portfolio.md)
- [estrategia de testes](../engenharia/estrategia-de-testes.md)
