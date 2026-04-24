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

## leitura do analista

Durante a apresentacao, a parte mais importante nao e mostrar todas as telas. A parte mais importante e explicar a decisao.

Leitura recomendada:

| ponto | leitura |
|---|---|
| demanda | existe um pedido com origem, destino e status operacional |
| capacidade | existe motorista e veiculo associados, mas a demo nao simula frota em escala |
| agenda | existe horario planejado, suficiente para demonstrar controle operacional |
| geografia | origem em Guarulhos e destino em Vila Olimpia criam uma leitura urbana plausivel |
| risco | janela, trafego, qualidade do endereco e disponibilidade real do recurso ainda precisariam ser controlados |
| decisao | antes de aumentar volume, revisar enderecos, agrupar entregas por regiao e definir capacidade por faixa horaria |

## indicadores que eu observaria

Estes indicadores nao precisam estar todos automatizados na demo. Eles mostram raciocinio profissional para evolucao futura:

| indicador | por que importa |
|---|---|
| pedidos planejados vs. nao planejados | mede disciplina operacional |
| pedidos sem motorista ou veiculo | mostra gargalo de capacidade |
| entregas por regiao | apoia agrupamento e roteirizacao |
| janela planejada vs. janela real | mostra risco de atraso |
| distancia ou tempo estimado | apoia custo e produtividade |
| replanejamentos | indica qualidade do planejamento inicial |

## fala final sugerida

```text
O fluxo demonstra uma operacao minima pronta: pedido, origem, destino, motorista, veiculo e agenda. Como analista, eu nao escalaria volume antes de revisar qualidade de enderecos, janelas de atendimento e agrupamento regional. A ferramenta serve como base operacional; a decisao vem da leitura dos dados.
```

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
