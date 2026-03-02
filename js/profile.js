/* ============================================
   LICS Dashboard — Profile Page Logic
   ============================================ */

import { getCurrentUser, isAdmin, requireAuth, updateHeaderUser } from './auth.js';
import { fetchMemberByUid, fetchTransactions } from './db.js';
import { getTitulo, getStatus, formatDate } from './utils.js';

let profileFilterCategory = 'all';

/**
 * Initialize the profile page
 */
async function initProfile() {
  const user = await requireAuth();
  if (!user) return;

  updateHeaderUser(user);

  // Hide admin link for non-admins
  if (!isAdmin()) {
    const navAdmin = document.getElementById('nav-admin');
    if (navAdmin) navAdmin.style.display = 'none';
  }

  // Get UID from URL params (or use current user)
  const urlParams = new URLSearchParams(window.location.search);
  const uid = urlParams.get('uid') || user.uid;

  if (!uid) {
    document.getElementById('profile-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">?_</div>
        <p class="empty-state-text">Usuário não encontrado.</p>
        <a href="dashboard.html" class="btn" style="margin-top: var(--space-md);">Voltar ao Ranking</a>
      </div>
    `;
    return;
  }

  await renderProfile(uid);
}

/**
 * Render the complete profile
 * @param {string} uid
 */
async function renderProfile(uid) {
  // Fetch member from Firestore
  let member;
  try {
    member = await fetchMemberByUid(uid);
  } catch (error) {
    console.error('Erro ao buscar membro:', error);
  }

  if (!member) {
    document.getElementById('profile-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">404</div>
        <p class="empty-state-text">Membro não encontrado no sistema.</p>
        <a href="dashboard.html" class="btn" style="margin-top: var(--space-md);">Voltar ao Ranking</a>
      </div>
    `;
    return;
  }

  const titulo = getTitulo(member.pontosTotais);
  const status = getStatus(member.pontosSemestre);

  // Render Hero
  document.getElementById('profile-hero').innerHTML = `
    <div class="profile-hero-inner">
      <div class="profile-avatar">
        <img src="assets/img/logo-without-bg.png" alt="${member.nome}" class="profile-avatar-img">
      </div>
      <div class="profile-details">
        <h1 class="profile-name">${member.nome}</h1>
        <div class="profile-meta">
          <span class="badge-title">${titulo.icone} ${titulo.titulo}</span>
          <span class="badge ${status.classe}">${status.status}</span>
        </div>
        <p class="profile-email" style="margin-top: 8px;">${member.email}</p>
      </div>
    </div>
  `;

  // Render Stats
  document.getElementById('profile-stats').innerHTML = `
    <div class="profile-stat-card">
      <div class="profile-stat-label">Pontos Totais</div>
      <div class="profile-stat-value">${member.pontosTotais}<span class="profile-stat-unit">pts</span></div>
    </div>
    <div class="profile-stat-card">
      <div class="profile-stat-label">Pontos do Semestre</div>
      <div class="profile-stat-value" style="color: ${status.cor};">${member.pontosSemestre}<span class="profile-stat-unit">pts</span></div>
    </div>
  `;

  // Render Timeline
  await renderTimeline(uid);
}

/**
 * Render transaction timeline
 * @param {string} uid
 */
async function renderTimeline(uid) {
  // Fetch transactions from Firestore
  let allTransactions = [];
  try {
    allTransactions = await fetchTransactions(uid);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
  }

  let transactions = [...allTransactions];

  // Apply category filter
  if (profileFilterCategory !== 'all') {
    transactions = transactions.filter(t => t.categoria === profileFilterCategory);
  }

  // Get unique categories for filter chips
  const categories = [...new Set(allTransactions.map(t => t.categoria))];

  const container = document.getElementById('profile-timeline');
  container.innerHTML = `
    <h3 class="profile-timeline-title">Histórico de Pontuação (Timeline)</h3>
    
    <!-- Category Filters -->
    <div class="profile-timeline-filters">
      <button class="filter-chip ${profileFilterCategory === 'all' ? 'active' : ''}" onclick="window._filterTimeline('all', '${uid}')">
        Todos
      </button>
      ${categories.map(cat => `
        <button class="filter-chip ${profileFilterCategory === cat ? 'active' : ''}" onclick="window._filterTimeline('${cat}', '${uid}')">
          ${cat}
        </button>
      `).join('')}
    </div>

    <!-- Timeline -->
    ${transactions.length > 0 ? `
      <div class="timeline">
        ${transactions.map(t => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-date">${formatDate(t.data)} | ${t.categoria.toUpperCase()}</div>
            <div class="timeline-content">
              ${t.descricao || t.atividade}
              <span class="timeline-points">+${t.pontos} pts</span>
            </div>
            <div class="timeline-admin">Admin: ${t.adminNome}</div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-state-icon">&gt;_</div>
        <p class="empty-state-text">Nenhuma transação encontrada${profileFilterCategory !== 'all' ? ' nesta categoria' : ''}.</p>
      </div>
    `}
  `;
}

/**
 * Filter timeline by category
 * @param {string} category
 * @param {string} uid
 */
function filterTimeline(category, uid) {
  profileFilterCategory = category;
  renderTimeline(uid);
}

// Expose functions for HTML onclick
window._filterTimeline = filterTimeline;

// Initialize on page load
document.addEventListener('DOMContentLoaded', initProfile);
