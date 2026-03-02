/* ============================================
   LICS Dashboard — Utility Functions
   ============================================ */

/**
 * Point categories and activities catalog
 */
const CATALOGO_PONTOS = {
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
    { nome: 'Presença em reuniões', pontos: 5 },
    { nome: 'Organização de eventos', pontos: 100 },
    { nome: 'Mentoria', pontos: 80 },
    { nome: 'Participação em projetos internos', pontos: 50 },
    { nome: 'Recrutamento ativo', pontos: 20 }
  ]
};

/**
 * Title thresholds based on total points
 */
const TITULOS = [
  { min: 1001, titulo: 'Elite LICS', subtitulo: 'God Mode', icone: '👑' },
  { min: 501,  titulo: 'APT', subtitulo: 'Advanced Persistent Threat', icone: '⚡' },
  { min: 201,  titulo: 'Operator', subtitulo: 'Operador de Campo', icone: '#_' },
  { min: 51,   titulo: 'Trainee', subtitulo: 'Em Treinamento', icone: '$_' },
  { min: 0,    titulo: 'Script Kiddie', subtitulo: 'Recém-chegado', icone: '>_' }
];

/**
 * Semester status thresholds
 */
const STATUS_SEMESTRE = [
  { min: 60, status: 'Ativo', classe: 'badge-ativo', cor: '#00aa00' },
  { min: 30, status: 'Em Alerta', classe: 'badge-alerta', cor: '#ffaa00' },
  { min: 0,  status: 'Inativo', classe: 'badge-inativo', cor: '#ff3333' }
];

/**
 * Get the LICS title based on total points
 * @param {number} pontosTotais
 * @returns {Object} { titulo, subtitulo, icone }
 */
function getTitulo(pontosTotais) {
  for (const t of TITULOS) {
    if (pontosTotais >= t.min) {
      return { titulo: t.titulo, subtitulo: t.subtitulo, icone: t.icone };
    }
  }
  return TITULOS[TITULOS.length - 1];
}

/**
 * Get the semester status based on semester points
 * @param {number} pontosSemestre
 * @returns {Object} { status, classe, cor }
 */
function getStatus(pontosSemestre) {
  for (const s of STATUS_SEMESTRE) {
    if (pontosSemestre >= s.min) {
      return { status: s.status, classe: s.classe, cor: s.cor };
    }
  }
  return STATUS_SEMESTRE[STATUS_SEMESTRE.length - 1];
}

/**
 * Calculate semester ID based on a date
 * Jan-Jun = .1, Jul-Dec = .2
 * @param {Date} [date=new Date()]
 * @returns {string} e.g. "2026.1"
 */
function getSemestreAtual(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const periodo = month <= 6 ? '1' : '2';
  return `${year}.${periodo}`;
}

/**
 * Format a date object to DD/MMM/YY format
 * @param {Date|string|{seconds:number}} date
 * @returns {string} e.g. "15/Mar/26"
 */
function formatDate(date) {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  let d;
  if (date instanceof Date) {
    d = date;
  } else if (date && typeof date === 'object' && date.seconds) {
    // Firestore Timestamp
    d = new Date(date.seconds * 1000);
  } else {
    d = new Date(date);
  }

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = meses[d.getMonth()];
  const ano = String(d.getFullYear()).slice(-2);
  
  return `${dia}/${mes}/${ano}`;
}

/**
 * Format a date to full format DD/MM/YYYY
 * @param {Date|string|{seconds:number}} date
 * @returns {string}
 */
function formatDateFull(date) {
  let d;
  if (date instanceof Date) {
    d = date;
  } else if (date && typeof date === 'object' && date.seconds) {
    d = new Date(date.seconds * 1000);
  } else {
    d = new Date(date);
  }

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
}

/**
 * Show a toast notification
 * @param {string} message 
 * @param {string} type - 'success' | 'warning' | 'error'
 * @param {number} duration - ms
 */
function showToast(message, type = 'success', duration = 3000) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Get points for a specific activity
 * @param {string} categoria
 * @param {string} atividade
 * @returns {number}
 */
function getPontosAtividade(categoria, atividade) {
  const cat = CATALOGO_PONTOS[categoria];
  if (!cat) return 0;
  const item = cat.find(a => a.nome === atividade);
  return item ? item.pontos : 0;
}

/**
 * Generate a unique ID (for mock data)
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Debounce function for search inputs
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
