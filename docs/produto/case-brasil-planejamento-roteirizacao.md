# case Brasil - planejamento e roteirizacao

## objetivo

Dar uma narrativa simples e brasileira para a demo de portfolio.

O case e ficticio. Ele serve para demonstrar criterio operacional, nao para prometer SLA, otimizacao matematica proprietaria ou operacao real de uma empresa.

## contexto

Uma operacao urbana precisa planejar uma entrega saindo de um ponto logistico na Grande Sao Paulo para um cliente na cidade de Sao Paulo.

O desafio demonstrado:

- registrar demanda;
- conferir origem e destino;
- associar motorista e veiculo;
- agendar a execucao;
- ler risco e proximo ajuste.

## dados do seed

Rodar:

```powershell
node tools/demo/seed-demo-case.js
```

Dados esperados:

| item | valor |
|---|---|
| origem | `RP Demo Origem CD Guarulhos` |
| destino | `RP Demo Destino Cliente Vila Olimpia` |
| motorista | `RP Demo Motorista Joao Silva` |
| veiculo | `RPD2026` |
| seed | `case-brasil-sp-001` |

O comando cria ou reutiliza os dados no runtime local. A ordem retornada no console do comando e a referencia principal para abrir a demo no FleetOps.

## roteiro de fala

1. A demanda esta registrada como pedido.
2. A origem e o destino estao padronizados.
3. Motorista e veiculo foram associados.
4. A agenda existe no scheduler.
5. O mapa/rotas apoiam a leitura operacional.
6. A recomendacao do analista e revisar janela, capacidade e agrupamento regional antes de escalar volume.

## leitura analitica esperada

```text
A operacao minima esta preparada para demonstracao: pedido, origem, destino, motorista, veiculo e agenda estao visiveis. O proximo ganho nao e criar mais infraestrutura, mas melhorar qualidade de dados, janela de atendimento e leitura de capacidade por regiao.
```

## fora do case

- app mobile do motorista;
- tracking publico para cliente;
- precificacao comercial;
- simulacao financeira;
- integracao ERP/WMS;
- ambiente web permanente como requisito;
- otimizacao automatica multiobjetivo.
