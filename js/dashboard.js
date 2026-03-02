/* ============================================
   LICS Dashboard — Dashboard Logic
   ============================================ */

/**
 * Mock member data for frontend development
 */
const MOCK_MEMBERS = [
  { uid: 'u001', nome: 'Maria Costa', email: 'm.costa@unicamp.br', role: 'admin', pontosTotais: 1350, pontosSemestre: 120, semestreAtual: '2026.1', slug: 'mariacosta' },
  { uid: 'u002', nome: 'João Silva', email: 'j.silva@unicamp.br', role: 'membro', pontosTotais: 980, pontosSemestre: 85, semestreAtual: '2026.1', slug: 'joaosilva' },
  { uid: 'u003', nome: 'Pedro Santos', email: 'p.santos@unicamp.br', role: 'membro', pontosTotais: 450, pontosSemestre: 42, semestreAtual: '2026.1', slug: 'pedrosantos' },
  { uid: 'u004', nome: 'Ana Pereira', email: 'a.pereira@unicamp.br', role: 'membro', pontosTotais: 180, pontosSemestre: 15, semestreAtual: '2026.1', slug: 'anapereira' },
  { uid: 'u005', nome: 'Carlos Almeida', email: 'c.almeida@unicamp.br', role: 'membro', pontosTotais: 48, pontosSemestre: 48, semestreAtual: '2026.1', slug: 'carlosalmeida' },
  { uid: 'u006', nome: 'Beatriz Lima', email: 'b.lima@unicamp.br', role: 'membro', pontosTotais: 720, pontosSemestre: 95, semestreAtual: '2026.1', slug: 'beatrizlima' },
  { uid: 'u007', nome: 'Rafael Oliveira', email: 'r.oliveira@unicamp.br', role: 'membro', pontosTotais: 310, pontosSemestre: 60, semestreAtual: '2026.1', slug: 'rafaeloliveira' },
  { uid: 'u008', nome: 'Fernanda Rodrigues', email: 'f.rodrigues@unicamp.br', role: 'membro', pontosTotais: 150, pontosSemestre: 25, semestreAtual: '2026.1', slug: 'fernandarodrigues' },
  { uid: 'u009', nome: 'Lucas Mendes', email: 'l.mendes@unicamp.br', role: 'membro', pontosTotais: 95, pontosSemestre: 70, semestreAtual: '2026.1', slug: 'lucasmendes' },
  { uid: 'u010', nome: 'Juliana Ferreira', email: 'j.ferreira@unicamp.br', role: 'membro', pontosTotais: 550, pontosSemestre: 55, semestreAtual: '2026.1', slug: 'julianaferreira' }
];

/**
 * Mock transactions for profile modal
 */
const MOCK_TRANSACTIONS = [
  { id: 't001', userId: 'u002', adminId: 'u001', adminNome: 'Maria Costa', categoria: 'Excelência Técnica', atividade: 'Cursos voltados à sec', descricao: 'Curso TryHackMe Sec Fundamentals', pontos: 10, data: new Date('2026-03-15'), semestreId: '2026.1' },
  { id: 't002', userId: 'u002', adminId: 'u001', adminNome: 'Maria Costa', categoria: 'Engajamento e Operação', atividade: 'Organização de eventos', descricao: 'Organização de Workshop Interno', pontos: 100, data: new Date('2026-04-01'), semestreId: '2026.1' },
  { id: 't003', userId: 'u002', adminId: 'u006', adminNome: 'Beatriz Lima', categoria: 'Produção de Conhecimento', atividade: 'Criação de artigos técnicos', descricao: 'Artigo sobre Buffer Overflow', pontos: 20, data: new Date('2026-04-10'), semestreId: '2026.1' },
  { id: 't004', userId: 'u002', adminId: 'u001', adminNome: 'Maria Costa', categoria: 'Excelência Técnica', atividade: 'Participação em CTF', descricao: 'CTF LICS Inter-Sec', pontos: 10, data: new Date('2026-04-15'), semestreId: '2026.1' },
  { id: 't005', userId: 'u002', adminId: 'u001', adminNome: 'Maria Costa', categoria: 'Engajamento e Operação', atividade: 'Presença em reuniões', descricao: 'Reunião semanal', pontos: 5, data: new Date('2026-04-20'), semestreId: '2026.1' },
  { id: 't006', userId: 'u003', adminId: 'u001', adminNome: 'Maria Costa', categoria: 'Excelência Técnica', atividade: 'Participação em CTF', descricao: 'CTF HackTheBox', pontos: 10, data: new Date('2026-03-20'), semestreId: '2026.1' },
  { id: 't007', userId: 'u003', adminId: 'u001', adminNome: 'Maria Costa', categoria: 'Produção de Conhecimento', atividade: 'Ministrar palestras/workshops', descricao: 'Workshop de Web Security', pontos: 80, data: new Date('2026-04-05'), semestreId: '2026.1' },
  { id: 't008', userId: 'u005', adminId: 'u001', adminNome: 'Maria Costa', categoria: 'Engajamento e Operação', atividade: 'Presença em reuniões', descricao: 'Reuniões semanais (Março)', pontos: 20, data: new Date('2026-03-28'), semestreId: '2026.1' },
  { id: 't009', userId: 'u005', adminId: 'u006', adminNome: 'Beatriz Lima', categoria: 'Produção de Conhecimento', atividade: 'Criação de artigos técnicos', descricao: 'Artigo sobre SQL Injection', pontos: 20, data: new Date('2026-04-12'), semestreId: '2026.1' },
  { id: 't010', userId: 'u001', adminId: 'u001', adminNome: 'Maria Costa', categoria: 'Engajamento e Operação', atividade: 'Organização de eventos', descricao: 'LICS Conference 2026', pontos: 100, data: new Date('2026-03-10'), semestreId: '2026.1' }
];

// State
let currentViewMode = 'total'; // 'total' | 'semestre'
let currentSort = { field: 'pontos', direction: 'desc' };
let searchQuery = '';

/**
 * Initialize the dashboard
 */
function initDashboard() {
  const user = getCurrentUser();
  if (user) {
    updateHeaderUser(user);
  }

  // Esconde coluna "Situação" para não-admin
  if (!isAdmin()) {
    const statusTh = document.querySelector('th[data-sort="status"]');
    if (statusTh) statusTh.style.display = 'none';
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
  const members = MOCK_MEMBERS.filter(m => m.role !== 'pendente');
  const totalMembers = members.length;
  const activeMembers = members.filter(m => getStatus(m.pontosSemestre).status === 'Ativo').length;
  const alertMembers = members.filter(m => getStatus(m.pontosSemestre).status === 'Em Alerta').length;
  const inactiveMembers = members.filter(m => getStatus(m.pontosSemestre).status === 'Inativo').length;

  document.getElementById('stat-total').textContent = totalMembers;

  // Stats de status só visíveis para admin
  const adminOnly = !isAdmin();
  const statActive = document.getElementById('stat-active');
  const statAlert = document.getElementById('stat-alert');
  const statInactive = document.getElementById('stat-inactive');

  if (adminOnly) {
    // Esconde os cards de status para membros comuns
    if (statActive) statActive.closest('.dashboard-stat').style.display = 'none';
    if (statAlert) statAlert.closest('.dashboard-stat').style.display = 'none';
    if (statInactive) statInactive.closest('.dashboard-stat').style.display = 'none';
  } else {
    if (statActive) { statActive.closest('.dashboard-stat').style.display = ''; statActive.textContent = activeMembers; }
    if (statAlert) { statAlert.closest('.dashboard-stat').style.display = ''; statAlert.textContent = alertMembers; }
    if (statInactive) { statInactive.closest('.dashboard-stat').style.display = ''; statInactive.textContent = inactiveMembers; }
  }
}

/**
 * Render the ranking table
 */
function renderRanking() {
  const tbody = document.getElementById('ranking-body');
  if (!tbody) return;

  let members = [...MOCK_MEMBERS].filter(m => m.role !== 'pendente');

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
      <tr onclick="openProfileModal('${m.uid}')" title="Ver perfil de ${m.nome}">
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
function openProfileModal(uid) {
  const member = MOCK_MEMBERS.find(m => m.uid === uid);
  if (!member) return;

  const titulo = getTitulo(member.pontosTotais);
  const status = getStatus(member.pontosSemestre);
  const transactions = MOCK_TRANSACTIONS.filter(t => t.userId === uid)
    .sort((a, b) => b.data - a.data);

  const modal = document.getElementById('profile-modal');
  const content = document.getElementById('profile-modal-content');

  const licsProfileUrl = `https://www.lics.tec.br/pt-br/membros/${member.slug || member.nome.toLowerCase().replace(/\s+/g, '')}/`;

  content.innerHTML = `
    <!-- Profile Header -->
    <div class="profile-card-header">
      <div class="profile-card-avatar">${titulo.icone}</div>
      <div class="profile-card-info">
        <h3>${member.nome}</h3>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px;">
          <span class="badge-title">${titulo.icone} ${titulo.titulo}</span>
          <a href="${licsProfileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm" style="font-size: 0.65rem; padding: 2px 8px;">Perfil LICS ↗</a>
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);
