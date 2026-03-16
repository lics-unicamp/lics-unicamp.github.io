/* ============================================
   LICS Dashboard — Static Data Module
   ============================================
   Static data shared across multiple dashboard
   pages. Single source of truth.
   ============================================ */

/**
 * Activity and scoring catalog
 * Used in: admin.js, rules.js
 */
export const CATALOGO_PONTOS = {
  'Excelência Técnica': [
    { nome: 'Participação em CTF', pontos: 10 },
    { nome: 'Cursos voltados à sec', pontos: 10 },
    { nome: 'Certificações', pontos: 100 },
    { nome: 'Participação em palestras', pontos: 10 }
  ],
  'Produção de Conhecimento': [
    { nome: 'Ministrar palestras/workshops', pontos: 80 },
    { nome: 'Criação de artigos técnicos', pontos: 20 },
    { nome: 'Curadoria de notícias', pontos: 10 }
  ],
  'Engajamento e Operação': [
    { nome: 'Presença em reuniões convencionais', pontos: 5 },
    { nome: 'Presença em reuniões estratégicas', pontos: 30 },
    { nome: 'Organização de eventos', pontos: 100 },
    { nome: 'Mentoria', pontos: 80 },
    { nome: 'Participação em projetos internos', pontos: 50 },
    { nome: 'Recrutamento ativo', pontos: 20 }
  ],
  'Penalizações': [
    { nome: 'Falta não justificada em reuniões', pontos: -5 },
    { nome: 'Atraso em entregas críticas de projeto', pontos: -30 },
    { nome: 'Falta não justificada em eventos oficiais da LICS', pontos: -5 },
    { nome: 'Plágio ou violação de diretrizes em CTFs/Produções', pontos: -10 },
    { nome: 'Inatividade não reportada (congelamento de presença superior a 1 mês sem aviso)', pontos: -10 },
    { nome: 'Desistência de cargo em organização de evento sem aviso prévio', pontos: -30 }
  ]
};

/**
 * Ranks — total points thresholds
 * Used in: dashboard.js, admin.js, rules.js, profile.js
 */
export const TITULOS = [
  { min: 1001, titulo: 'Elite LICS', subtitulo: 'God Mode', icone: '👑' },
  { min: 501, titulo: 'APT', subtitulo: 'Advanced Persistent Threat', icone: '⚡' },
  { min: 201, titulo: 'Operator', subtitulo: 'Field Agent', icone: '#_' },
  { min: 51, titulo: 'Trainee', subtitulo: 'Laboratório Init', icone: '$_' },
  { min: 0, titulo: 'Script Kiddie', subtitulo: 'pwned by life', icone: '>_' }
];

/**
 * Semester status — semester points thresholds
 * Used in: dashboard.js, admin.js, profile.js
 */
export const STATUS_SEMESTRE = [
  { min: 60, status: 'Ativo', classe: 'badge-ativo', cor: '#00aa00' },
  { min: 30, status: 'Em Alerta', classe: 'badge-alerta', cor: '#ffaa00' },
  { min: 0, status: 'Inativo', classe: 'badge-inativo', cor: '#ff3333' }
];
