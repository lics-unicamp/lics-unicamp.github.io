# LICS Scoreboard

Sistema de Pontuação Interno da **Liga de Cibersegurança da UNICAMP** (LICS).

Utilizado para recompensar destaques, acompanhar engajamento e justificar decisões administrativas com base em métricas objetivas.

> **Stack:** HTML + CSS + JavaScript + Firebase (Firestore + Auth)
> **Deploy:** GitHub Pages

---

## Estrutura de Pastas

```
lics-dashboard/
├── index.html              # Landing page / Login
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
│   ├── firebase-init.js    # Configuração Firebase (placeholders)
│   ├── auth.js             # Autenticação (mock p/ dev, Firebase p/ prod)
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
┌──────────────────────────────────────────────┐
│              GitHub Pages (Frontend)          │
│                                              │
│  index.html ──► dashboard.html ──► admin.html│
│                      │                       │
│                 profile.html                 │
│                                              │
│  JS: auth.js → utils.js → dashboard.js      │
│                            admin.js          │
│                            profile.js        │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │     Firebase     │
         │                 │
         │  Auth (Google)  │
         │  Firestore DB   │
         └─────────────────┘
```

### Modelo de Dados (Firestore)

**Coleção `users`**
| Campo          | Tipo     | Descrição                        |
|----------------|----------|----------------------------------|
| `uid`          | string   | ID do Firebase Auth              |
| `nome`         | string   | Nome completo                    |
| `email`        | string   | E-mail @unicamp.br               |
| `role`         | string   | `admin` \| `membro` \| `pendente`|
| `slug`         | string   | Slug p/ perfil lics.tec.br       |
| `pontosTotais` | number   | Pontuação acumulada              |
| `pontosSemestre`| number  | Pontuação do semestre atual      |
| `semestreAtual` | string  | Ex: `2026.1`                     |

**Coleção `transactions`**
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
- Presença em reuniões — **5 pts**
- Organização de eventos — **100 pts**
- Mentoria — **80 pts**
- Participação em projetos internos — **50 pts**
- Recrutamento ativo — **20 pts**

---

## Funcionalidades

### Páginas

| Página         | Acesso    | Descrição |
|---------------|-----------|-----------|
| `index.html`  | Público   | Login com Google (@unicamp.br) |
| `dashboard.html`| Membros | Ranking, busca, filtro total/semestre |
| `profile.html`| Membros   | Perfil individual, histórico de pontos |
| `admin.html`  | Admin     | Lançar pontos, gerir membros, histórico |

### Controle de Acesso

- **Novo login** → role `pendente` → tela de aguardando aprovação
- **Admin aprova** → role muda para `membro`
- **Coluna "Situação"** → visível apenas para admin
- **Cards de status** (Ativos/Em Alerta/Inativos) → visíveis apenas para admin
- **Perfil LICS** → botão no modal direciona para `lics.tec.br/pt-br/membros/{slug}/`

### Semestre

- Gerado automaticamente: Jan–Jun = `.1`, Jul–Dez = `.2`
- Exemplo: `2026.1` para primeiro semestre de 2026

---


## O que Falta (TO-DO List)

- [ ] Integração real com Firebase Auth (substituir mock)
- [ ] Integração real com Firestore (substituir dados mock)
- [ ] Fluxo de aprovação de pendentes (tela "Aguardando Aprovação")
- [ ] Firestore Security Rules em produção
- [ ] Remover Dev Toolbar em produção
- [ ] Reset automático de `pontosSemestre` a cada semestre
- [ ] Exportação de dados (CSV/PDF)
- [ ] Notificações (e-mail ou in-app) para mudanças de status


