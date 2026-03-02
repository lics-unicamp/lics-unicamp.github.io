/* ============================================
   LICS Dashboard — Dashboard Logic
   ============================================ */

import { getCurrentUser, isAdmin, requireAuth, updateHeaderUser } from './auth.js';
import { fetchAllMembers, fetchTransactions, checkAndResetSemestre } from './db.js';
import { getTitulo, getStatus, formatDate, debounce, showToast } from './utils.js';

// State
let currentViewMode = 'total'; // 'total' | 'semestre'
let currentSort = { field: 'pontos', direction: 'desc' };
let searchQuery = '';
let membersCache = [];
let transactionsCache = {};

/**
 * Initialize the dashboard
 */
async function initDashboard() {
  const user = await requireAuth();
  if (!user) return; // Redirecionado

  updateHeaderUser(user);

  // Show "Status" column and admin link for admins
  if (isAdmin()) {
    const statusTh = document.getElementById('th-status');
    if (statusTh) statusTh.style.display = '';
    const navAdmin = document.getElementById('nav-admin');
    if (navAdmin) navAdmin.style.display = 'inline-flex';
  }

  // Fetch members from Firestore
  try {
    // Lazy reset: if admin loads and semester changed, reset pontosSemestre
    if (isAdmin()) {
      const didReset = await checkAndResetSemestre();
      if (didReset) {
        showToast('Novo semestre detectado! Pontos semestrais resetados.', 'success', 5000);
      }
    }
    membersCache = await fetchAllMembers(false);
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    membersCache = [];
  }

  renderStats();
  renderRanking();
  setupEventListeners();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentViewMode = btn.dataset.mode;
      renderRanking();
      renderStats();
    });
  });

  // Search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      searchQuery = e.target.value.toLowerCase();
      renderRanking();
    }, 200));
  }

  // Modal close
  const modalOverlay = document.getElementById('profile-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeProfileModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeProfileModal();
    });
  }

  // Table header sorting
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.field = field;
        currentSort.direction = 'desc';
      }
      renderRanking();
    });
  });
}

/**
 * Render the summary stats
 */
function renderStats() {
  const members = membersCache.filter(m => m.role !== 'pendente' && m.role !== 'admin');
  const totalMembers = members.length;
  const activeMembers = members.filter(m => getStatus(m.pontosSemestre).status === 'Ativo').length;
  const alertMembers = members.filter(m => getStatus(m.pontosSemestre).status === 'Em Alerta').length;
  const inactiveMembers = members.filter(m => getStatus(m.pontosSemestre).status === 'Inativo').length;

  document.getElementById('stat-total').textContent = totalMembers;

  // Status stats only visible to admin
  if (isAdmin()) {
    const statActiveContainer = document.getElementById('stat-active-container');
    const statAlertContainer = document.getElementById('stat-alert-container');
    const statInactiveContainer = document.getElementById('stat-inactive-container');

    if (statActiveContainer) { statActiveContainer.style.display = ''; document.getElementById('stat-active').textContent = activeMembers; }
    if (statAlertContainer) { statAlertContainer.style.display = ''; document.getElementById('stat-alert').textContent = alertMembers; }
    if (statInactiveContainer) { statInactiveContainer.style.display = ''; document.getElementById('stat-inactive').textContent = inactiveMembers; }
  }
}

/**
 * Render the ranking table
 */
function renderRanking() {
  const tbody = document.getElementById('ranking-body');
  if (!tbody) return;

  let members = [...membersCache].filter(m => m.role !== 'pendente' && m.role !== 'admin');

  // Filter by search
  if (searchQuery) {
    members = members.filter(m =>
      m.nome.toLowerCase().includes(searchQuery) ||
      m.email.toLowerCase().includes(searchQuery)
    );
  }

  // Sort
  const pointsField = currentViewMode === 'total' ? 'pontosTotais' : 'pontosSemestre';

  members.sort((a, b) => {
    let valA, valB;

    switch (currentSort.field) {
      case 'nome':
        valA = a.nome.toLowerCase();
        valB = b.nome.toLowerCase();
        return currentSort.direction === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      case 'titulo':
        valA = a.pontosTotais;
        valB = b.pontosTotais;
        break;
      case 'status':
        valA = a.pontosSemestre;
        valB = b.pontosSemestre;
        break;
      case 'pontos':
      default:
        valA = a[pointsField];
        valB = b[pointsField];
        break;
    }

    return currentSort.direction === 'asc' ? valA - valB : valB - valA;
  });

  // Render
  const showStatus = isAdmin();
  tbody.innerHTML = members.map((m, i) => {
    const titulo = getTitulo(m.pontosTotais);
    const status = getStatus(m.pontosSemestre);
    const pos = i + 1;
    const posClass = pos <= 3 ? `rank-pos-${pos}` : '';
    const pontos = currentViewMode === 'total' ? m.pontosTotais : m.pontosSemestre;
    const statusCell = showStatus ? `<td><span class="badge ${status.classe}">${status.status}</span></td>` : '';

    return `
      <tr onclick="window._openProfileModal('${m.uid}')" title="Ver perfil de ${m.nome}">
        <td class="rank-pos ${posClass}">${pos}</td>
        <td>
          <div class="member-name">${m.nome}</div>
          <div class="member-email">${m.email}</div>
        </td>
        <td><span class="badge-title">${titulo.icone} ${titulo.titulo}</span></td>
        ${statusCell}
        <td class="points-cell">${pontos} pts</td>
      </tr>
    `;
  }).join('');

  // Update sort indicators
  document.querySelectorAll('th[data-sort]').forEach(th => {
    const icon = th.querySelector('.sort-icon');
    if (th.dataset.sort === currentSort.field) {
      th.classList.add('sorted');
      if (icon) icon.textContent = currentSort.direction === 'asc' ? '▲' : '▼';
    } else {
      th.classList.remove('sorted');
      if (icon) icon.textContent = '⇅';
    }
  });
}

/**
 * Open the profile modal for a member
 * @param {string} uid
 */
async function openProfileModal(uid) {
  const member = membersCache.find(m => m.uid === uid);
  if (!member) return;

  const titulo = getTitulo(member.pontosTotais);
  const status = getStatus(member.pontosSemestre);

  // Fetch transactions from Firestore (with cache)
  let transactions = transactionsCache[uid];
  if (!transactions) {
    try {
      transactions = await fetchTransactions(uid);
      transactionsCache[uid] = transactions;
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      transactions = [];
    }
  }

  const modal = document.getElementById('profile-modal');
  const content = document.getElementById('profile-modal-content');

  content.innerHTML = `
    <!-- Profile Header -->
    <div class="profile-card-header">
      <div class="profile-card-avatar">${titulo.icone}</div>
      <div class="profile-card-info">
        <h3>${member.nome}</h3>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
          <span class="badge-title">${titulo.icone} ${titulo.titulo}</span>
        </div>
        <div style="margin-top: 4px;">
          <span class="mono text-muted" style="font-size: 0.75rem;">${member.email}</span>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="profile-card-stats">
      <div class="profile-card-stat">
        <div class="stat-label">Pontos Totais</div>
        <div class="stat-value">${member.pontosTotais}</div>
      </div>
      <div class="profile-card-stat">
        <div class="stat-label">Pontos do Semestre</div>
        <div class="stat-value" style="color: ${status.cor}">${member.pontosSemestre}</div>
      </div>
    </div>

    <!-- Timeline -->
    <div style="padding: var(--space-lg);">
      <h4 class="text-primary" style="margin-bottom: var(--space-md); text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.85rem;">
        Histórico de Pontuação
      </h4>
      ${transactions.length > 0 ? `
        <div class="timeline">
          ${transactions.map(t => `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-date">${formatDate(t.data)}</div>
              <div class="timeline-category">${t.categoria}</div>
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
          <p class="empty-state-text">Nenhuma transação registrada.</p>
        </div>
      `}
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Close the profile modal
 */
function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Expose functions for HTML onclick
window._openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);
