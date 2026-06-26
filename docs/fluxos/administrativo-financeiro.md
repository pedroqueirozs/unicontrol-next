# Setor Administrativo e Financeiro

## Colaboradores
- 1 colaborador (com possibilidade de aumento)

---

## Fluxo de Cotação e Envio de Frete

```
Recebe pedido da Expedição (com dimensões e pesos das caixas)
      ↓
Realiza cotação nos transportadores disponíveis:
  - Correios
  - Transportadora
  - Via Ônibus
  - Retirada na empresa
      ↓
Escolhe o frete mais barato
      ↓
Anota no pedido: transportador + valor do frete
      ↓
Passa para a Contabilidade emitir a nota fiscal
      ↓
Contabilidade imprime a NF e entrega para a Expedição
      ↓
Expedição libera a mercadoria para o transportador
```

---

## Fluxo de Impressão de Endereços

```
Recebe pedido impresso do setor de Vendas
      ↓
Expedição analisa o pedido e informa a quantidade de endereços necessários
      ↓
Administrativo digita os endereços no Word e imprime
      ↓
Anexa os endereços no pedido impresso
      ↓
Envia para a Expedição arrumar o pedido
```

---

## Formas de Recebimento

### Boleto Bancário
- Geração manual de boletos no site do banco
- Envio manual por e-mail ou WhatsApp
- Nomenclatura do arquivo salvo: `CIDADE NÚMERO_NF-01 a 02.pdf`
  - Exemplo: `BELO HORIZONTE 2560-01 a 02.pdf` (os 2 boletos da compra estão no mesmo PDF)
- Nota fiscal salva com o número da NF: `NF 2560.pdf`
- Arquivos salvos em servidor local
- E-mail escrito individualmente para cada cliente com boletos e NF em anexo

### Pix
- Pagamento exigido antes do envio do material
- Cliente realiza o pagamento
- Administrativo imprime o comprovante e anexa ao pedido físico

---

## Controle de Tráfego de Mercadorias (Mercadorias Enviadas)

Após saída do material, anotação manual em planilha online (Excel) com os campos:

| Campo | Descrição |
|---|---|
| Destinatário | Nome do cliente/destinatário |
| Nota Fiscal | Número da NF |
| Cidade de Destino | Cidade para onde foi enviado |
| Transportador | Qual transportadora/meio foi usado |
| Data da Saída | Data em que saiu da empresa |
| Situação | `No prazo` / `Atrasada` / `Entregue` — controlada manualmente todo dia |
| Previsão de Entrega | Data estimada de entrega |
| Observação | Campo livre |

> **Observação:** O módulo de Gestão de Mercadorias do UniControl já implementa esse fluxo.

---

## Controle de Fretes (Mensal)

```
Ao final do mês:
      ↓
Puxa relatório das notas enviadas por transportador
      ↓
Para cada nota: compara valor cobrado do cliente x valor pago na transportadora
      ↓
Verifica se o resultado foi positivo ou negativo
```

**Regra de negócio importante:**
- O frete na transportadora é custeado pela empresa
- O cliente paga o valor do frete embutido no pedido (na nota fiscal)
- É adicionada uma **margem de segurança** no valor cobrado do cliente para absorver variações
- A transportadora pode cobrar valor diferente da cotação (faz pesagem e cubagem própria ao receber)
- Quando o valor cobrado não cobre o custo, medidas são tomadas para compensar no mês seguinte

---

## Controle de Boletos a Pagar (Fornecedores e Prestadores)

```
Recebe boleto do fornecedor/prestador
      ↓
Imprime
      ↓
Confere
      ↓
Escaneia e salva em PDF
      ↓
Salva no Drive na estrutura de pastas correta
      ↓
Anota na planilha de controle
```

### Estrutura de Pastas no Drive

**Fornecedores:**
```
Boletos/
└── [Nome do Fornecedor]/
    └── [Nome da Nota]/
        └── arquivo_escaneado.pdf
```

**Prestadores de Serviço:**
```
Boletos/
└── [Nome do Prestador]/
    └── [Nome do Mês]/
        └── arquivo_escaneado.pdf
```

**Observação:** O pagamento dos boletos é feito pela **proprietária da empresa**, que mantém controle próprio dos comprovantes. O setor administrativo não tem acesso aos comprovantes de pagamento.

---

## Cobrança de Duplicatas Vencidas

- Diariamente: puxa relatório de boletos vencidos no banco
- Realiza cobrança individual de cada boleto vencido

---

## Controle de Pendências (Planilhas)

Mantém planilhas separadas para:
- Pendências com clientes
- Pendências com fornecedores
- Pendências com transportadores

---

## Arquivamento de Pedidos

Após envio dos boletos para os clientes:
- Pedidos impressos são armazenados em **pastas físicas** na empresa
- Acessados quando necessário
