# Arquitetura — UniControl (v2)

Documento que descreve a estrutura de dados (PostgreSQL via Prisma), decisões arquiteturais e fluxos técnicos do sistema.

> O schema completo e comentado está em `prisma/schema.prisma` — esse arquivo é sempre a fonte da verdade.
> Este documento resume o *porquê* das decisões e como os módulos se conectam ao schema, sem duplicar cada campo.

---

## Modelo Multi-tenant (SaaS)

O UniControl é um SaaS onde cada empresa tem seus dados isolados.
Toda tabela de negócio tem uma coluna `companyId`, e **toda query do banco deve filtrar por ela** — é o erro mais grave que pode acontecer no sistema (ver `CLAUDE.md`).

Um usuário (`User`) pertence a uma única empresa (`Company`) e possui um `role` que define seu nível de acesso (`RN-18`).

---

## Tabelas e Módulos

| Tabela (Prisma) | Módulo correspondente | Observação |
|---|---|---|
| `Company` | Configurações (dados da empresa) | `logoUrl` guarda a logo como **base64 direto na coluna** — não usa filesystem nem storage externo, funciona sem estado persistente na Vercel |
| `User` | Gerenciar Usuários / Login | Combina os campos exigidos pelo adapter do NextAuth com os campos próprios do app (`role`, `companyId`). Senha é hash bcrypt na própria tabela — não existe sistema de auth separado |
| `Account`, `Session`, `VerificationToken` | — (infra do NextAuth) | Exigidas pelo `@auth/prisma-adapter` mesmo sem provider OAuth configurado. `Session` não é usada de fato hoje: a estratégia é `jwt`, então a sessão vive inteira no cookie assinado, não no banco |
| `Invite` | Gerenciar Usuários → convites | Token = `cuid()`, validade de 7 dias, `used: true` após o cadastro consumir o convite |
| `Client` / `Supplier` | Cadastros, Endereços, Mercadorias, Pendências | Fonte central de dados — outros módulos referenciam por `clientId`/`supplierId` em vez de duplicar cadastro |
| `Carrier` | Configurações → transportadoras | `type: empresa` (dados completos + URL de rastreio) ou `simples` (só nome, ex: retirada no local) |
| `GoodsShipped` | Mercadorias Enviadas | `name`/`city`/`uf` são denormalizados do cliente (evita join só pra exibir a tabela). `trackingCodes` é `String[]` nativo do Postgres; `notesHistory` é `Json` (array de `{id, text, createdAt}`) |
| `Pending` | Pendências | Um único model pra cliente e fornecedor, diferenciado pelo campo `type: "client" \| "supplier"`. `updates` é `Json`, histórico imutável |
| `StockProduct` | Estoque → produtos | `code` é sequencial por empresa (`max(code) + 1`); `sku` é o código do sistema antigo, mantido só pra busca de transição |
| `StockMovement` | Estoque → entrada/saída/estorno/ajuste | Registro imutável — nunca é editado ou apagado, mesmo para corrigir erro (ver RN-21); campos do produto são denormalizados (`productName`, `productCode`, `productSku`) pra preservar histórico mesmo se o produto for editado ou excluído depois. `type`: `"entrada" \| "saida" \| "estorno" \| "ajuste"`; `direction`: `1` = soma ao estoque, `-1` = subtrai. `reversalOfId`/`reversedAt` vinculam um estorno ao lançamento original. `previousStock`/`newStock` guardam o antes/depois de um ajuste |

---

## Autenticação (NextAuth v5)

- Provider único: `Credentials` (e-mail + senha, hash bcrypt) — sem OAuth por enquanto.
- Estratégia de sessão: **JWT**, não banco. O token carrega `id`, `role` e `companyId` (ver callbacks `jwt`/`session` em `src/auth.config.ts`).
- Duas instâncias do NextAuth coexistem por causa do Edge Runtime:
  - `src/auth.config.ts` — configuração "leve", sem Prisma/bcrypt, usada tanto como base do `auth.ts` quanto pelo `src/proxy.ts` (que roda no Edge e não pode importar Node.js completo).
  - `src/auth.ts` — configuração completa, com o `authorize()` real (consulta Prisma + `bcrypt.compare`), usada pelas rotas de API e Server Components.
- `src/proxy.ts` (equivalente ao antigo `middleware.ts` a partir do Next.js 16) faz duas coisas em toda requisição de página:
  1. Redireciona não-logados para `/login` (exceto rotas sempre públicas, ex: `/rastreio/[id]`)
  2. Bloqueia acesso direto por URL a módulos restritos (`/financial`, `/settings`, `/manage-users`) pra quem não é `admin`/`administrativo` — ver `RN-18`

---

## Fluxo de Onboarding de uma Nova Empresa

Hoje é feito manualmente via script, não existe painel de super-admin:

```
1. Pedro roda `npm run seed` com as variáveis SEED_* no .env apontando pra nova empresa/admin
   (o script recusa rodar se já existir alguma Company no banco — só serve pro bootstrap inicial)
2. Pedro envia e-mail/senha do admin criado para o proprietário da empresa
3. Proprietário loga → acessa "Gerenciar Usuários"
4. Proprietário gera convites para seus funcionários (define o role de cada um)
5. Funcionários se cadastram via /register?token=xxx
```

## Fluxo de Convite de Novo Membro

```
Admin/administrativo acessa "Gerenciar Usuários"
      ↓
Gera convite → escolhe o role (administrativo, expedicao ou vendas — não dá pra convidar como admin)
      ↓
POST /api/invites cria um Invite com validade de 7 dias
      ↓
Admin copia o link (/register?token=xxx) e envia ao funcionário
      ↓
Funcionário abre o link, preenche nome, e-mail e senha
      ↓
POST /api/auth/register valida: token existe + não usado + não expirado + e-mail ainda livre
      ↓
Em uma transação: cria o User (senha hasheada) + marca o Invite como used: true
      ↓
Funcionário é redirecionado para o login
```

---

## Decisões Arquiteturais

### Por que JWT em vez de sessão no banco, se a tabela `Session` existe?
O `@auth/prisma-adapter` exige as tabelas `Account`/`Session`/`VerificationToken` para funcionar mesmo quando não são usadas na prática. Com `session.strategy: "jwt"`, a sessão real vive no cookie assinado (`AUTH_SECRET`) — a tabela `Session` fica ociosa hoje. Isso implica um detalhe importante: **remover um usuário não invalida sessões já abertas na hora** (o token continua válido até expirar, ~30 dias por padrão) — ver `RN-17`.

### Por que denormalizar campos em vez de só usar relations?
`GoodsShipped.name/city/uf` e os campos de produto em `StockMovement` são cópias no momento do registro, não referências vivas. Isso evita um join extra só pra listar a tabela, e principalmente **preserva o histórico**: se um cliente for editado ou um produto excluído, os registros antigos continuam mostrando os dados de quando o evento aconteceu.

### Por que `notesHistory`/`updates` são `Json` em vez de tabelas separadas?
São listas pequenas, de tamanho previsível, sempre lidas/escritas junto com o registro pai (nunca precisam ser filtradas ou paginadas independentemente). Uma tabela relacional separada seria overhead sem benefício real no volume de dados esperado.

### Por que o primeiro admin de cada empresa é criado via script (seed)?
Para o volume de clientes esperado, o custo de rodar `npm run seed` manualmente é mínimo. Implementar um painel de super-admin completo seria over-engineering nesse estágio (mesmo raciocínio do projeto anterior, ainda válido).

### Por que o token do convite é `cuid()` e não `crypto.randomUUID()`?
O projeto anterior gerava o token no cliente (browser). Aqui o convite é criado inteiramente no servidor (`POST /api/invites`), então usar o gerador padrão do Prisma (`cuid()`) é mais simples e já garante unicidade — não há motivo pra usar uma função diferente só pra gerar o token.
