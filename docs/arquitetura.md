# Arquitetura — UniControl

Documento que descreve a estrutura de dados do Firestore, decisões arquiteturais e fluxos técnicos do sistema.

---

## Modelo Multi-tenant (SaaS)

O UniControl é um SaaS onde cada empresa tem seus dados isolados.
Um usuário pertence a uma empresa e possui um role que define seu nível de acesso.

---

## Estrutura do Firestore

### `companies/{companyId}`
Representa uma empresa cadastrada no sistema.

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | string | Nome da empresa |
| `street` | string | Endereço (rua e número) |
| `district` | string | Bairro |
| `city` | string | Cidade |
| `state` | string | Estado (ex: MG) |
| `zip` | string | CEP |
| `phone` | string | Telefone fixo |
| `whatsapp` | string | WhatsApp |
| `createdAt` | Timestamp | Data de criação |
| `logoUrl` | string \| null | URL pública da logo no Firebase Storage (opcional) |

> Criado manualmente pelo proprietário do SaaS (Pedro) para cada novo cliente.
> Os campos de endereço e contato são usados como remetente na geração de etiquetas (.docx).
> `logoUrl` é gerenciado pelo próprio admin da empresa via módulo de Configurações → aba Empresa.
> Arquivo armazenado em `companies/{companyId}/logo` no Firebase Storage.

---

### `users/{uid}`
Representa um usuário do sistema. O ID do documento é o mesmo UID do Firebase Auth.

| Campo | Tipo | Descrição |
|---|---|---|
| `companyId` | string | ID da empresa à qual o usuário pertence |
| `role` | string | Role do usuário: `admin`, `expedicao` ou `vendas` |
| `name` | string | Nome completo |
| `email` | string | E-mail do usuário |

> O primeiro `admin` de cada empresa é criado manualmente pelo proprietário do SaaS.
> Os demais usuários são criados via fluxo de convite.

---

### `invites/{token}`
Representa um convite gerado pelo admin para adicionar um novo membro à empresa.
O token é gerado via `crypto.randomUUID()`.

| Campo | Tipo | Descrição |
|---|---|---|
| `companyId` | string | ID da empresa para qual o convite foi gerado |
| `role` | string | Role que o novo usuário receberá |
| `expiresAt` | Timestamp | Data de expiração do convite |
| `used` | boolean | Se o convite já foi utilizado |
| `createdAt` | Timestamp | Data de criação do convite |

---

### `companies/{companyId}/{modulo}/{docId}`
Todos os dados de negócio ficam aninhados sob a empresa.

Exemplos:
```
companies/{companyId}/goods_shipped/{docId}
companies/{companyId}/financial/{docId}
companies/{companyId}/addresses/{docId}       ← depreciada (ver nota abaixo)
companies/{companyId}/customers_pending/{docId}
companies/{companyId}/suppliers_pending/{docId}
companies/{companyId}/carriers/{docId}
companies/{companyId}/clients/{docId}
companies/{companyId}/suppliers/{docId}
```

> **Nota:** A coleção `addresses` foi depreciada. O módulo de Gestão de Endereços passou a usar as coleções `clients` e `suppliers` como fonte de dados. Nenhum novo documento é gravado em `addresses`.

---

### `companies/{companyId}/goods_shipped/{docId}`
Representa uma mercadoria enviada.

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | string | Nome do cliente (preenchido automaticamente do cadastro) |
| `document_number` | string | Nota fiscal ou documento de referência |
| `city` | string | Cidade (preenchida automaticamente do cadastro) |
| `uf` | string | Estado (preenchido automaticamente do cadastro) |
| `transporter` | string | Nome da transportadora |
| `shipping_date` | Timestamp | Data de envio |
| `delivery_forecast` | Timestamp | Previsão de entrega |
| `delivery_date` | Timestamp \| null | Data real de entrega (null se não entregue) |
| `notes` | string \| null | Anotações livres |
| `created_at` | Timestamp | Data de criação do registro |
| `clientId` | string | ID do documento na coleção `clients` — **obrigatório** |
| `clientCode` | string | Código do cliente (ex: `C-001`) — **obrigatório** |
| `flagged` | boolean | Sinaliza o registro para atenção (opcional) |
| `trackingCodes` | string[] | Códigos de rastreio dos Correios (opcional, múltiplos) |
| `notesHistory` | NoteEntry[] | Histórico de observações (opcional, ver estrutura abaixo) |

**Estrutura de cada item em `notesHistory`:**

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | UUID gerado no cliente |
| `text` | string | Texto da observação |
| `createdAt` | Timestamp | Data e hora da observação |

> Todo envio deve ser vinculado a um cliente do cadastro (RN-19).
> `situation` (Entregue / No Prazo / Atrasada) é calculada no cliente, não armazenada.
> `flagged` é ativado/desativado diretamente na tabela sem abrir formulário.
> Observações antigas salvas no campo `notes` (string) continuam visíveis no modal como entrada legada.

---

### `companies/{companyId}/customers_pending/{docId}`
Representa uma pendência com um cliente.

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | string | Nome do cliente |
| `city` | string | Cidade |
| `document` | string | NF ou outro documento de referência |
| `openedAt` | Timestamp | Data de abertura da pendência |
| `status` | string | `aberta`, `em_andamento` ou `resolvida` |
| `createdAt` | Timestamp | Data de criação do registro |
| `updates` | array | Lista de atualizações (ver abaixo) |
| `clientId` | string | ID do cliente no cadastro (opcional, quando selecionado) |
| `clientCode` | string | Código do cliente (opcional) |

**Estrutura de cada item em `updates`:**

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | UUID gerado no cliente (evita duplicatas no arrayUnion) |
| `text` | string | Texto da atualização |
| `createdAt` | Timestamp | Data e hora da atualização |

---

### `companies/{companyId}/suppliers_pending/{docId}`
Representa uma pendência com um fornecedor.

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | string | Nome do fornecedor |
| `city` | string | Cidade |
| `document` | string | NF ou outro documento de referência |
| `openedAt` | Timestamp | Data de abertura da pendência |
| `status` | string | `aberta`, `em_andamento` ou `resolvida` |
| `createdAt` | Timestamp | Data de criação do registro |
| `updates` | array | Lista de atualizações (ver abaixo) |
| `supplierId` | string | ID do fornecedor no cadastro (opcional, quando selecionado) |
| `supplierCode` | string | Código do fornecedor (opcional) |

**Estrutura de cada item em `updates`:**

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | UUID gerado no cliente (evita duplicatas no arrayUnion) |
| `text` | string | Texto da atualização |
| `createdAt` | Timestamp | Data e hora da atualização |

> A primeira `update` é criada automaticamente no momento da criação da pendência, a partir do campo "Descrição inicial" do formulário.
> Data de abertura padrão = hoje (dayjs).

---

### `companies/{companyId}/carriers/{docId}`
Representa uma transportadora cadastrada pela empresa.

| Campo | Tipo | Descrição |
|---|---|---|
| `name` | string | Nome da transportadora |
| `trackingUrl` | string \| null | URL da página de rastreio da transportadora (opcional) |
| `createdAt` | Timestamp | Data de criação do registro |

> Gerenciado pelo admin via Configurações → aba Operacional.
> Usado como lista de opções nos módulos que envolvem escolha de transportadora.
> `trackingUrl` é exibida como botão de atalho nas ações da tabela de Mercadorias Enviadas.

---

### `companies/{companyId}/clients/{docId}`
Representa um cliente cadastrado no sistema. Fonte de dados central para os módulos de Endereços, Mercadorias e Pendências de Clientes.

| Campo | Tipo | Descrição |
|---|---|---|
| `code` | string | Código gerado automaticamente no cadastro (ex: `C-001`, `C-002`) |
| `name` | string | Nome / Razão Social |
| `cnpj` | string | CNPJ ou CPF — **obrigatório**, com máscara automática |
| `street` | string | Logradouro |
| `number` | string | Número |
| `complement` | string | Complemento (opcional) |
| `neighborhood` | string | Bairro |
| `city` | string | Cidade |
| `state` | string | Estado (sigla, ex: SP) |
| `zipCode` | string | CEP com máscara automática (opcional) |
| `phone` | string | Telefone (opcional) |
| `email` | string | E-mail (opcional) |
| `createdAt` | Timestamp | Data de criação do registro |

> Gerenciado pelo admin via módulo Cadastros → aba Clientes.
> O código é gerado automaticamente em sequência — não é mais inserido manualmente.
> Um mesmo CNPJ pode ter múltiplos cadastros (endereços diferentes para o mesmo cliente).
> Busca nos módulos é feita por nome ou CNPJ/CPF.

---

### `companies/{companyId}/suppliers/{docId}`
Representa um fornecedor cadastrado no sistema. Fonte de dados central para os módulos de Endereços e Pendências com Fornecedores.

Campos idênticos à coleção `clients`. Código gerado automaticamente no formato `F-001`, `F-002`...

> Gerenciado pelo admin via módulo Cadastros → aba Fornecedores.

---

## Roles e Permissões

Definidos em `RN-16` (`docs/regras-de-negocio.md`).

| Role | Rota padrão após login |
|---|---|
| `admin` | `/dashboard` |
| `expedicao` | `/address` |
| `vendas` | `/profile` |

---

## Fluxo de Onboarding de um Novo Cliente

```
1. Pedro cria o documento companies/{companyId} no Firestore
2. Pedro cria o usuário admin no Firebase Auth (console)
3. Pedro cria o documento users/{uid} no Firestore com role: "admin"
4. Pedro envia as credenciais para o proprietário da empresa
5. Proprietário loga → acessa "Gerenciar Usuários"
6. Proprietário gera links de convite para seus funcionários
7. Funcionários se cadastram via /invite?token=xxx
```

---

## Fluxo de Convite de Novo Membro

```
Admin acessa "Gerenciar Usuários"
      ↓
Clica em "Convidar membro" → seleciona o role
      ↓
Sistema cria invites/{token} com validade de 7 dias
      ↓
Admin copia o link gerado e envia ao funcionário (WhatsApp, e-mail)
      ↓
Funcionário acessa /invite?token=xxx
      ↓
Sistema valida: token existe + não foi usado + não expirou
      ↓
Funcionário preenche nome, e-mail e senha
      ↓
Sistema cria conta no Firebase Auth
Sistema cria users/{uid} com companyId e role do convite
Sistema marca invites/{token} como used: true
      ↓
Funcionário é redirecionado para o login
```

---

## Decisões Arquiteturais

### Por que Firestore e não Firebase Auth Custom Claims para roles?
Custom Claims do Firebase Auth exigem Firebase Admin SDK (backend/Cloud Functions).
Usar Firestore para guardar roles evita essa dependência, mantendo o projeto 100% client-side.

### Por que o token do convite é gerado no cliente?
`crypto.randomUUID()` é nativo no browser e gera UUIDs criptograficamente seguros (versão 4).
Para o volume de usuários esperado, a probabilidade de colisão é desprezível.

### Por que o primeiro admin é criado manualmente?
Para os 3 clientes iniciais, o custo de criar manualmente é mínimo.
Implementar um painel de super-admin completo seria over-engineering nesse estágio.
