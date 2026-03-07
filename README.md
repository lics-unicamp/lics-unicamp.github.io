# LICS Scoreboard

Sistema de Pontuação Interno da **Liga de Cibersegurança da UNICAMP** (LICS).

Utilizado para recompensar destaques, acompanhar engajamento e justificar decisões administrativas com base em métricas objetivas.

> **Stack:** HTML + CSS + JavaScript + Firebase (Firestore + Auth)
> **Deploy:** GitHub Pages

---

## Estrutura de Pastas

```
lics-dashboard/
├── index.html              # Landing page / Login + tela "Aguardando Aprovação"
├── dashboard.html          # Ranking geral de membros
├── profile.html            # Perfil individual + histórico
├── admin.html              # Painel administrativo (diretoria)
│
├── css/
│   ├── main.css            # Design system global (cores, tipografia, componentes)
│   ├── index.css           # Estilos da página de login
│   ├── dashboard.css       # Estilos da tabela de ranking e stats
│   ├── admin.css           # Estilos do painel administrativo
│   └── profile.css         # Estilos da página de perfil
│
├── js/
│   ├── firebase-init.js    # Configuração e inicialização Firebase SDK
│   ├── auth.js             # Autenticação Firebase (Google Sign-In)
│   ├── db.js               # Módulo centralizado de operações Firestore
│   ├── utils.js            # Catálogo de pontos, títulos, status, helpers
│   ├── dashboard.js        # Lógica do ranking, filtros, modal de perfil
│   ├── admin.js            # Lançamento de pontos, gestão de membros
│   └── profile.js          # Renderização do perfil e timeline
│
└── assets/
    └── img/
        ├── logo-without-bg.png  # Logo LICS (sem fundo)
        ├── lics-logo.png        # Logo LICS (com fundo)
        └── favicon.ico          # Favicon
```

---

## Arquitetura

### Visão Geral

```
┌────────────────────────────────────────────────────┐
│              GitHub Pages (Frontend)               │
│              ES Modules (type="module")            │
│                                                    │
│  index.html ──► dashboard.html ──► admin.html      │
│                      │                             │
│                 profile.html                       │
│                                                    │
│  firebase-init.js ──► auth.js ──► dashboard.js     │
│         │              │          admin.js         │
│         └──► db.js ◄───┘          profile.js       │
│              │                                     │
│         utils.js (helpers)                         │
└──────────────────────┬─────────────────────────────┘
                       │
                       ▼
             ┌─────────────────┐
             │     Firebase    │
             │                 │
             │     Auth        │
             │  Firestore DB   │
             └─────────────────┘
```

### Controle de Acesso (Domínios)

| E-mail | Permissão | Notas |
|--------|-----------|-------|
| `*@dac.unicamp.br` | Membro (self-register como `pendente`) | Domínio DAC |
| `lics.unicamp@gmail.com` | **Admin (diretoria)** | Exceção ao domínio |
| `lics@unicamp.br` | **Admin (diretoria)** | Domínio institucional |

### Modelo de Dados (Firestore)

**Coleção `users`** (doc ID = Firebase Auth UID)
| Campo          | Tipo     | Descrição                        |
|----------------|----------|----------------------------------|
| `nome`         | string   | Nome completo                    |
| `email`        | string   | E-mail do membro                 |
| `role`         | string   | `admin` \| `membro` \| `pendente` \| `bloqueado` |
| `slug`         | string   | Slug p/ perfil lics.tec.br       |
| `pontosTotais` | number   | Pontuação acumulada              |
| `pontosSemestre`| number  | Pontuação do semestre atual      |
| `semestreAtual` | string  | Ex: `2026.1`                     |

**Coleção `transactions`** (imutável — update/delete bloqueados)
| Campo       | Tipo      | Descrição                       |
|-------------|-----------|--------------------------------------|
| `userId`    | string    | UID do membro pontuado               |
| `adminId`   | string    | UID do admin que lançou              |
| `adminNome` | string    | Nome do admin                        |
| `categoria` | string    | Categoria da atividade               |
| `atividade` | string    | Nome da atividade                    |
| `descricao` | string    | Descrição livre                      |
| `pontos`    | number    | Pontos atribuídos                    |
| `data`      | timestamp | Data do lançamento                   |
| `semestreId`| string    | Ex: `2026.1`                         |

---

## Gamificação: Títulos LICS

| Ícone | Título        | Faixa de Pontos  |
|-------|---------------|------------------|
| `>_`  | Script Kiddie | 0 – 50 pts       |
| `$_`  | Trainee       | 51 – 200 pts     |
| `#_`  | Operator      | 201 – 500 pts    |
| ⚡    | APT           | 501 – 1000 pts   |
| 👑    | Elite LICS    | +1000 pts        |

### Status do Semestre

| Status    | Pontos Semestre | Cor      |
|-----------|-----------------|----------|
| Ativo     | ≥ 60 pts        | 🟢 Verde |
| Em Alerta | 30 – 59 pts     | 🟡 Amarelo|
| Inativo   | < 30 pts        | 🔴 Vermelho|

---

## Catálogo de Atividades

### Excelência Técnica
- Participação em CTF — **10 pts**
- Cursos voltados à sec — **10 pts**
- Certificações — **100 pts**
- Participação em palestras — **10 pts**

### Produção de Conhecimento
- Ministrar palestras/workshops — **80 pts**
- Criação de artigos técnicos — **20 pts**
- Curadoria de notícias — **10 pts**

### Engajamento e Operação
- Presença em reuniões convencionais — **5 pts**
- Presença em reuniões estratégicas — **30 pts**
- Organização de eventos — **100 pts**
- Mentoria — **80 pts**
- Participação em projetos internos — **50 pts**
- Recrutamento ativo — **20 pts**

### Penalizações
- Falta não justificada em reuniões — **-5 pts**
- Atraso em entregas críticas de projeto — **-30 pts**
- Falta não justificada em eventos oficiais da LICS — **-5 pts**
- Plágio ou violação de diretrizes em CTFs/Produções — **-10 pts**
- Inatividade não reportada (congelamento de presença superior a 1 mês sem aviso) — **-10 pts**
- Desistência de cargo em organização de evento sem aviso prévio — **-30 pts**

---

## Como Criar Novas Regras de Pontuação

O sistema de pontos foi projetado para ser totalmente dinâmico. Para adicionar, remover ou modificar categorias e pontuações, **não é necessário alterar o HTML nem o Banco de Dados**.

1. Abra o local do arquivo: `js/utils.js`.
2. Localize a constante em torno da linha 8: `export const CATALOGO_PONTOS`.
3. Adicione uma nova categoria no formato de chave do objeto, ou insira um novo item de atividade dentro do array de uma categoria já existente.
4. Salve o arquivo. A interface Web (no Painel Admin) puxará as atualizações processando o arquivo JavaScript automaticamente.

**Exemplo Prático (Criando regras e penalidades):**
```javascript
export const CATALOGO_PONTOS = {
  // ... outras categorias ...
  'Eventos Especiais': [
    { nome: 'Ajudou a organizar Hackathon', pontos: 50 },
    { nome: 'Faltou no Hackathon sem avisar', pontos: -20 } // Valores negativos funcionam nativamente!
  ]
};
```

---

## Funcionalidades

### Páginas

| Página         | Acesso    | Descrição |
|---------------|-----------|-----------|
| `index.html`  | Público   | Login com Google (@dac.unicamp.br + admin Gmail) |
| `dashboard.html`| Membros | Ranking, busca, filtro total/semestre |
| `profile.html`| Membros   | Perfil individual, histórico de pontos |
| `admin.html`  | Admin     | Lançar pontos, gerir membros, histórico, exportar PDF |

### Controle de Acesso

- **Novo login** → role `pendente` → tela "Aguardando Aprovação"
- **Admin aprova** → role muda para `membro`
- **Admin recusa** → documento excluído do Firestore
- **Admin expulsa** → role muda para `bloqueado` → tela "Acesso Revogado"
- **Admin não aparece** nas listas de gestão (proteção contra auto-exclusão)
- **Coluna "Situação"** e **cards de status** → visíveis apenas para admin

### Semestre

- Gerado automaticamente: Jan–Jun = `.1`, Jul–Dez = `.2`
- **Lazy Reset:** quando o admin acessa o dashboard no novo semestre, `pontosSemestre` é resetado automaticamente para todos os membros

---

## Segurança

- **Firestore Security Rules** validam domínio server-side (`@dac.unicamp.br` + admins Gmail/institucional)
- **Transactions imutáveis** — `update` e `delete` bloqueados nas rules
- **Self-register restrito** — novos usuários só podem criar doc com `role: 'pendente'` e pontos `0`
- **Admin verificado via Firestore** — campo `role` no documento, não no client
- **Session timeout (50 min)** — sessão expira automaticamente via `sessionStorage` + TTL; fechar o navegador também encerra a sessão
- **API Key pública** é normal no Firebase — Security Rules são a proteção real


