/* ============================================
   LICS Dashboard — Utility Functions
   ============================================ */

import { CATALOGO_PONTOS, TITULOS, STATUS_SEMESTRE } from './data.js';

// Re-export data for backward compatibility
export { CATALOGO_PONTOS, TITULOS, STATUS_SEMESTRE };

/**
 * Get the LICS title based on total points
 * @param {number} pontosTotais
 * @returns {Object} { titulo, subtitulo, icone }
 */
export function getTitulo(pontosTotais) {
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
export function getStatus(pontosSemestre) {
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
export function getSemestreAtual(date = new Date()) {
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
export function formatDate(date) {
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
export function formatDateFull(date) {
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
export function showToast(message, type = 'success', duration = 3000) {
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
export function getPontosAtividade(categoria, atividade) {
  const cat = CATALOGO_PONTOS[categoria];
  if (!cat) return 0;
  const item = cat.find(a => a.nome === atividade);
  return item ? item.pontos : 0;
}

/**
 * Debounce function for search inputs
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
export function debounce(func, wait = 300) {
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
