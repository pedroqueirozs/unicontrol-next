# UI Patterns — UniControl

Documento que descreve o design system e os padrões visuais do projeto.
Deve ser lido antes de criar qualquer componente ou página.

---

## Fonte

**Inter** — Google Fonts, variável weight (100–900).
No Next.js, importar via `next/font/google`:

```ts
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
```

---

## Paleta de Cores

As cores são definidas como variáveis CSS em `reference/styles/index.css` e expostas via Tailwind em `reference/styles/tailwind.config.js`.

O sistema usa HSL para facilitar a criação do dark mode — basta redefinir as variáveis no seletor `.dark`.

### Cores principais

| Token Tailwind | Uso |
|---|---|
| `background_primary_400` | Cor principal da marca — sidebar, botões primários, destaques |
| `background_primary_500` | Variante mais saturada da cor principal |
| `background_white` | Fundo de cards, modais, áreas de conteúdo |
| `text_primary_400` | Títulos e textos de destaque |
| `text_secondary` | Texto padrão do corpo |
| `text_white` | Texto sobre fundos escuros (sidebar) |
| `details_green` | Indicadores positivos, status "entregue", borda ativa na sidebar |
| `details_red` | Indicadores negativos, alertas de erro |
| `input_bg` | Fundo dos inputs |
| `input_border` | Borda padrão dos inputs |
| `input_border_focus` | Borda dos inputs com foco |
| `notification_error` | Toast de erro |
| `notification_success` | Toast de sucesso |
| `notification_warn` | Toast de aviso |

---

## Layout Principal

```
┌──────────────────────────────────────────┐
│  Sidebar (w-72, bg_primary_400, fixed)   │
│  ┌─ Logo ──────────────────────────┐     │
│  └─ Nav items ───────────────────  │     │
│                                    │     │
│  ┌── Header (h-20) ──────────────────┐   │
│  │  [☰] TÍTULO DA PÁGINA   [Avatar]  │   │
│  └───────────────────────────────────┘   │
│  ┌── Main content ───────────────────┐   │
│  │  border rounded-md, overflow-auto │   │
│  │  footer: © Ano NomeDaEmpresa      │   │
│  └───────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

- Sidebar: fixa no desktop, drawer com backdrop no mobile
- Sidebar fecha ao clicar fora (mobile) ou ao navegar
- Header: botão de menu visível só no mobile (md:hidden)

---

## Componentes Base

### Input
- Fundo: `input_bg`
- Borda: `input_border`, foco em `input_border_focus`
- Altura: `h-11`
- Label acima com mensagem de erro inline (cor `notification_error`)
- Ícone opcional no lado direito com fundo `input_bg_icon`
- Ver: `reference/components/Input.tsx`

### Button
- Altura: `h-12`, largura total (`w-full`)
- Estado de loading mostra "Carregando..." e cursor-progress
- Cor configurável via props (não hardcoded)
- Ver: `reference/components/Button.tsx`

### Modais
- Overlay: `fixed inset-0 bg-black/50 z-50`
- Container: `bg-white rounded-2xl shadow-xl`, largura máxima por contexto
- Fecha com botão X no canto ou botão Cancelar
- Ver: `reference/components/ExampleModal.tsx`

### Tabelas
- **Não usar MUI DataGrid** — usar TanStack Table com Tailwind
- Colunas com cabeçalho, linhas com hover highlight
- Ações por linha (editar, excluir, etc.) no canto direito
- Suporte a ordenação e filtro

### Sidebar — Item ativo
- Borda esquerda: `border-l-4 border-details_green`
- Font: `font-semibold`
- Hover: `opacity-70`

### Confirmação de ação destrutiva
- Dialog simples com texto da ação + botões "Cancelar" e "Confirmar"
- Ver: `reference/components/ConfimDialog.tsx`

---

## Dark Mode

O projeto é construído com dark mode desde o início.
Estratégia: `darkMode: "class"` no Tailwind — adicionar classe `dark` no `<html>`.

As variáveis CSS devem ter dois blocos:
```css
:root { /* light */ }
.dark { /* dark */ }
```

Pedro fará as definições do tema dark manualmente antes de iniciar o desenvolvimento dos módulos.

---

## Logos

| Arquivo | Quando usar |
|---|---|
| `unicontrol-logo-light.svg` | Sobre fundos escuros (sidebar, dark mode) |
| `unicontrol-logo-dark.svg` | Sobre fundos claros (light mode) |
| `logo-unicontrol.svg` | Favicon / ícone isolado |

---

## Ícones

Biblioteca: **Lucide React** (`lucide-react`).
Tamanho padrão: `size={24}` para nav, `size={18}` para ícones em linha.
