/* ============================================
   LICS Dashboard — Admin Panel Logic
   ============================================ */

import { getCurrentUser, isAdmin, requireAuth, updateHeaderUser } from './auth.js';
import {
    fetchAllMembers, fetchTransactions, submitPointsBatch,
    approveMember as dbApproveMember, rejectMember as dbRejectMember, blockMember as dbBlockMember
} from './db.js';
import { CATALOGO_PONTOS, getTitulo, getStatus, formatDate, getSemestreAtual, getPontosAtividade, showToast, debounce } from './utils.js';

// State
let selectedMembers = new Set();
let adminSearchQuery = '';
let membersCache = [];
let transactionsCache = [];

/**
 * Initialize admin panel
 */
async function initAdmin() {
    const user = await requireAuth(true); // Requires admin
    if (!user) return;

    updateHeaderUser(user);

    // Fetch members from Firestore (including pending)
    try {
        membersCache = await fetchAllMembers(true);
    } catch (error) {
        console.error('Erro ao buscar membros:', error);
        membersCache = [];
    }

    // Fetch recent transactions
    try {
        transactionsCache = await fetchTransactions(null, 20);
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        transactionsCache = [];
    }

    setupAdminTabs();
    populateCategorias();
    renderMemberSelectList();
    renderManageMembers();
    renderTransactionLog();
    setupAdminEventListeners();
}

/**
 * Setup tab navigation
 */
function setupAdminTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            const content = document.getElementById(`tab-${tabId}`);
            if (content) content.classList.add('active');
        });
    });
}

/**
 * Populate category and activity dropdowns
 */
function populateCategorias() {
    const catSelect = document.getElementById('select-categoria');
    const actSelect = document.getElementById('select-atividade');
    if (!catSelect || !actSelect) return;

    catSelect.innerHTML = '<option value="">Selecione a categoria...</option>';
    Object.keys(CATALOGO_PONTOS).forEach(cat => {
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });

    catSelect.addEventListener('change', () => {
        const categoria = catSelect.value;
        actSelect.innerHTML = '<option value="">Selecione a atividade...</option>';
        if (categoria && CATALOGO_PONTOS[categoria]) {
            CATALOGO_PONTOS[categoria].forEach(item => {
                actSelect.innerHTML += `<option value="${item.nome}" data-pontos="${item.pontos}">${item.nome} (+${item.pontos})</option>`;
            });
        }
        updatePointsPreview();
    });

    actSelect.addEventListener('change', updatePointsPreview);
}

/**
 * Update points preview
 */
function updatePointsPreview() {
    const actSelect = document.getElementById('select-atividade');
    const preview = document.getElementById('points-preview');
    if (!actSelect || !preview) return;

    const selectedOption = actSelect.options[actSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.pontos) {
        preview.textContent = `+${selectedOption.dataset.pontos} pts`;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

/**
 * Setup event listeners
 */
function setupAdminEventListeners() {
    const searchInput = document.getElementById('admin-member-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            adminSearchQuery = e.target.value.toLowerCase();
            renderMemberSelectList();
        }, 200));
    }

    const submitBtn = document.getElementById('btn-submit-points');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitPoints);
    }
}

/**
 * Render the member selection list (exclude admin self)
 */
function renderMemberSelectList() {
    const tbody = document.getElementById('member-select-body');
    if (!tbody) return;

    const currentUser = getCurrentUser();
    let members = [...membersCache]
        .filter(m => m.role !== 'pendente' && m.role !== 'bloqueado')
        .filter(m => m.uid !== currentUser.uid && m.email !== 'lics.unicamp@gmail.com' && m.role !== 'admin'); // Admin doesn't appear in the list

    if (adminSearchQuery) {
        members = members.filter(m =>
            m.nome.toLowerCase().includes(adminSearchQuery) ||
            m.email.toLowerCase().includes(adminSearchQuery)
        );
    }

    tbody.innerHTML = members.map(m => {
        const titulo = getTitulo(m.pontosTotais);
        const status = getStatus(m.pontosSemestre);
        const isSelected = selectedMembers.has(m.uid);

        return `
      <tr class="${isSelected ? 'selected' : ''}" onclick="window._toggleMemberSelection('${m.uid}')">
        <td style="width: 40px; text-align: center;">
          <input type="checkbox" class="member-checkbox" ${isSelected ? 'checked' : ''} 
            onclick="event.stopPropagation(); window._toggleMemberSelection('${m.uid}')">
        </td>
        <td>
          <div style="font-weight: 600; color: var(--color-text-bright);">${m.nome}</div>
        </td>
        <td>
          <span class="mono text-muted" style="font-size: 0.75rem;">${m.email}</span>
        </td>
        <td><span class="badge-title" style="font-size: 0.65rem;">${titulo.titulo}</span></td>
        <td><span class="badge ${status.classe}" style="font-size: 0.6rem;">${status.status}</span></td>
      </tr>
    `;
    }).join('');

    const countEl = document.getElementById('selected-count');
    if (countEl) {
        countEl.textContent = `${selectedMembers.size} membro(s) selecionado(s)`;
    }
}

/**
 * Toggle member selection
 */
function toggleMemberSelection(uid) {
    if (selectedMembers.has(uid)) {
        selectedMembers.delete(uid);
    } else {
        selectedMembers.add(uid);
    }
    renderMemberSelectList();
}

/**
 * Select/deselect all members
 */
function toggleSelectAll() {
    const currentUser = getCurrentUser();
    const selectableMembers = membersCache
        .filter(m => m.role !== 'pendente' && m.role !== 'bloqueado')
        .filter(m => m.uid !== currentUser.uid && m.email !== 'lics.unicamp@gmail.com' && m.role !== 'admin');

    if (selectedMembers.size === selectableMembers.length) {
        selectedMembers.clear();
    } else {
        selectableMembers.forEach(m => selectedMembers.add(m.uid));
    }
    renderMemberSelectList();
}

/**
 * Submit points to selected members
 */
async function submitPoints() {
    const categoria = document.getElementById('select-categoria').value;
    const atividade = document.getElementById('select-atividade').value;
    const descricao = document.getElementById('input-descricao').value;
    const dataInput = document.getElementById('input-data').value;

    if (selectedMembers.size === 0) { showToast('Selecione pelo menos um membro.', 'error'); return; }
    if (!categoria) { showToast('Selecione uma categoria.', 'error'); return; }
    if (!atividade) { showToast('Selecione uma atividade.', 'error'); return; }

    const pontos = getPontosAtividade(categoria, atividade);
    const semestreId = getSemestreAtual(dataInput ? new Date(dataInput) : new Date());
    const user = getCurrentUser();

    const submitBtn = document.getElementById('btn-submit-points');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processando...';

    try {
        const uids = [...selectedMembers];
        await submitPointsBatch(uids, {
            categoria, atividade,
            descricao: descricao || atividade,
            pontos,
            data: dataInput || null,
            semestreId
        }, { uid: user.uid, nome: user.nome });

        const memberNames = uids.map(uid => membersCache.find(m => m.uid === uid)?.nome).filter(Boolean).join(', ');
        showToast(`+${pontos} pts atribuídos a ${uids.length} membro(s): ${memberNames}`, 'success', 4000);

        uids.forEach(uid => {
            const member = membersCache.find(m => m.uid === uid);
            if (member) {
                member.pontosTotais += pontos;
                member.pontosSemestre += pontos;
            }
        });

        // Reset form
        selectedMembers.clear();
        document.getElementById('select-categoria').value = '';
        document.getElementById('select-atividade').innerHTML = '<option value="">Selecione a atividade...</option>';
        document.getElementById('input-descricao').value = '';
        document.getElementById('points-preview').style.display = 'none';

        renderMemberSelectList();
        renderManageMembers();

        transactionsCache = await fetchTransactions(null, 20);
        renderTransactionLog();

    } catch (error) {
        console.error('Erro ao lançar pontos:', error);
        showToast('Erro ao lançar pontos. Verifique as permissões.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Credenciar Pontos';
    }
}

/**
 * Render the manage members section
 */
function renderManageMembers() {
    const currentUser = getCurrentUser();

    // Pending members
    const pendingMembers = membersCache.filter(m => m.role === 'pendente');
    renderPendingSection(pendingMembers);

    // Active members (exclude admin self)
    const activeMembers = membersCache.filter(m =>
        m.role !== 'pendente' && m.role !== 'bloqueado' && m.uid !== currentUser.uid && m.email !== 'lics.unicamp@gmail.com' && m.role !== 'admin' &&
        getStatus(m.pontosSemestre).status === 'Ativo'
    );
    renderMemberStatusSection('ativo', activeMembers, 'Membros Ativos', 'text-ativo');

    // Alert members
    const alertMembers = membersCache.filter(m =>
        m.role !== 'pendente' && m.role !== 'bloqueado' && m.uid !== currentUser.uid && m.email !== 'lics.unicamp@gmail.com' && m.role !== 'admin' &&
        getStatus(m.pontosSemestre).status === 'Em Alerta'
    );
    renderMemberStatusSection('alerta', alertMembers, 'Membros em Alerta', 'text-alerta');

    // Inactive members
    const inactiveMembers = membersCache.filter(m =>
        m.role !== 'pendente' && m.role !== 'bloqueado' && m.uid !== currentUser.uid && m.email !== 'lics.unicamp@gmail.com' && m.role !== 'admin' &&
        getStatus(m.pontosSemestre).status === 'Inativo'
    );
    renderMemberStatusSection('inativo', inactiveMembers, 'Membros Inativos', 'text-inativo');
}

/**
 * Render pending members section with Approve/Reject buttons
 */
function renderPendingSection(members) {
    const container = document.getElementById('manage-pending');
    if (!container) return;

    const header = container.querySelector('.members-status-header');
    const body = container.querySelector('.members-status-body');

    header.innerHTML = `
    <span class="members-status-title text-pending">Membros Pendentes</span>
    <span class="members-status-count">${members.length}</span>
  `;

    if (members.length === 0) {
        body.innerHTML = `<div style="padding: var(--space-lg); text-align: center;"><span class="text-muted" style="font-size: 0.85rem;">Nenhum membro pendente.</span></div>`;
        return;
    }

    body.innerHTML = `
    <table class="manage-table">
      <thead><tr><th>Nome</th><th>E-mail</th><th>Ação</th></tr></thead>
      <tbody>
        ${members.map(m => `
          <tr>
            <td style="font-weight: 600; color: var(--color-text-bright);">${m.nome}</td>
            <td><span class="mono text-muted" style="font-size: 0.75rem;">${m.email}</span></td>
            <td style="display: flex; gap: 8px;">
              <button class="btn btn-sm" onclick="window._approveMember('${m.uid}')">Aprovar</button>
              <button class="btn btn-sm btn-danger" onclick="window._rejectMember('${m.uid}', '${m.nome}')">Recusar</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Render a member status section with Expel button
 */
function renderMemberStatusSection(id, members, title, colorClass) {
    const container = document.getElementById(`manage-${id}`);
    if (!container) return;

    const header = container.querySelector('.members-status-header');
    const body = container.querySelector('.members-status-body');

    header.innerHTML = `
    <span class="members-status-title ${colorClass}">${title}</span>
    <span class="members-status-count">${members.length}</span>
  `;

    if (members.length === 0) {
        body.innerHTML = `<div style="padding: var(--space-lg); text-align: center;"><span class="text-muted" style="font-size: 0.85rem;">Nenhum membro nesta categoria.</span></div>`;
        return;
    }

    body.innerHTML = `
    <table class="manage-table">
      <thead><tr><th>Nome</th><th>E-mail</th><th>Título</th><th>Pts Semestre</th><th>Ação</th></tr></thead>
      <tbody>
        ${members.map(m => {
        const titulo = getTitulo(m.pontosTotais);
        return `
            <tr>
              <td style="font-weight: 600; color: var(--color-text-bright);">${m.nome}</td>
              <td><span class="mono text-muted" style="font-size: 0.75rem;">${m.email}</span></td>
              <td><span class="badge-title" style="font-size: 0.65rem;">${titulo.icone} ${titulo.titulo}</span></td>
              <td class="mono">${m.pontosSemestre} pts</td>
              <td>
                <button class="btn btn-sm btn-danger" onclick="window._blockMember('${m.uid}', '${m.nome}')">Expulsar</button>
              </td>
            </tr>
          `;
    }).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Approve a pending member
 */
async function handleApproveMember(uid) {
    const member = membersCache.find(m => m.uid === uid);
    if (!member) return;

    try {
        await dbApproveMember(uid);
        member.role = 'membro';
        showToast(`${member.nome} aprovado como membro!`, 'success');
        renderManageMembers();
        renderMemberSelectList();
    } catch (error) {
        console.error('Erro ao aprovar membro:', error);
        showToast('Erro ao aprovar membro.', 'error');
    }
}

/**
 * Reject a pending member (delete doc)
 */
async function handleRejectMember(uid, nome) {
    if (!confirm(`Tem certeza que deseja recusar "${nome}"? O documento será excluído.`)) return;

    try {
        await dbRejectMember(uid);
        membersCache = membersCache.filter(m => m.uid !== uid);
        showToast(`${nome} foi recusado e removido.`, 'success');
        renderManageMembers();
    } catch (error) {
        console.error('Erro ao recusar membro:', error);
        showToast('Erro ao recusar membro.', 'error');
    }
}

/**
 * Block/expel an active member
 */
async function handleBlockMember(uid, nome) {
    if (!confirm(`Tem certeza que deseja expulsar "${nome}"? O acesso será revogado.`)) return;

    try {
        await dbBlockMember(uid);
        const member = membersCache.find(m => m.uid === uid);
        if (member) member.role = 'bloqueado';
        showToast(`${nome} foi expulso. Acesso revogado.`, 'success');
        renderManageMembers();
        renderMemberSelectList();
    } catch (error) {
        console.error('Erro ao expulsar membro:', error);
        showToast('Erro ao expulsar membro.', 'error');
    }
}

/**
 * Render recent transaction log
 */
function renderTransactionLog() {
    const container = document.getElementById('transaction-log-body');
    if (!container) return;

    if (transactionsCache.length === 0) {
        container.innerHTML = `<div style="padding: var(--space-lg); text-align: center;"><span class="text-muted">Nenhuma transação registrada.</span></div>`;
        return;
    }

    container.innerHTML = transactionsCache.map(t => {
        const member = membersCache.find(m => m.uid === t.userId);
        return `
      <div class="transaction-row">
        <span class="transaction-date">${formatDate(t.data)}</span>
        <span class="transaction-desc">
          <strong>${member ? member.nome : 'Desconhecido'}</strong> — ${t.descricao || t.atividade}
          <span class="text-muted" style="font-size: 0.75rem;">(${t.categoria})</span>
        </span>
        <span class="transaction-points">+${t.pontos} pts</span>
      </div>
    `;
    }).join('');
}

/**
 * Export ranking as PDF using jsPDF + jspdf-autotable
 */
async function exportRankingPDF() {
    showToast('Gerando PDF...', 'success', 2000);

    try {
        // Lazy load jsPDF library
        const { jsPDF } = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js');
        await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js');

        const doc = new jsPDF();
        const semestre = getSemestreAtual();
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

        // Title
        doc.setFontSize(18);
        doc.setTextColor(0, 100, 0);
        doc.text('LICS SCOREBOARD', 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text(`Ranking Geral — Semestre ${semestre}`, 14, 28);
        doc.text(`Gerado em: ${dateStr}`, 14, 34);

        // Prepare data (exclude pending, blocked, and admin)
        const currentUser = getCurrentUser();
        const members = [...membersCache]
            .filter(m => m.role !== 'pendente' && m.role !== 'bloqueado' && m.uid !== currentUser.uid && m.email !== 'lics.unicamp@gmail.com' && m.role !== 'admin')
            .sort((a, b) => b.pontosTotais - a.pontosTotais);

        const tableData = members.map((m, i) => {
            const titulo = getTitulo(m.pontosTotais);
            const status = getStatus(m.pontosSemestre);
            return [
                i + 1,
                m.nome,
                m.email,
                titulo.titulo,
                status.status,
                m.pontosTotais,
                m.pontosSemestre
            ];
        });

        // Table
        doc.autoTable({
            startY: 40,
            head: [['#', 'Nome', 'E-mail', 'Título', 'Situação', 'Pts Total', 'Pts Semestre']],
            body: tableData,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [34, 36, 28], textColor: [0, 170, 0] },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                5: { halign: 'right' },
                6: { halign: 'right' }
            }
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `LICS — Liga de Cibersegurança da UNICAMP | Página ${i} de ${pageCount}`,
                doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }

        doc.save(`ranking-lics-${semestre}.pdf`);
        showToast('PDF exportado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showToast('Erro ao gerar PDF. Tente novamente.', 'error');
    }
}

// Set today's date as default
function setDefaultDate() {
    const dateInput = document.getElementById('input-data');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
}

// Expose functions to window for HTML onclick
window._toggleMemberSelection = toggleMemberSelection;
window._toggleSelectAll = toggleSelectAll;
window._approveMember = handleApproveMember;
window._rejectMember = handleRejectMember;
window._blockMember = handleBlockMember;
window._exportRankingPDF = exportRankingPDF;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
    setDefaultDate();
});
