/* ============================================
   LICS Dashboard — Admin Panel Logic
   ============================================ */

// State
let selectedMembers = new Set();
let adminSearchQuery = '';
let currentAdminTab = 'lancar-pontos';

/**
 * Initialize admin panel
 */
function initAdmin() {
    const user = getCurrentUser();
    if (user) {
        updateHeaderUser(user);
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

            // Update tab buttons
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update tab content
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            const content = document.getElementById(`tab-${tabId}`);
            if (content) content.classList.add('active');

            currentAdminTab = tabId;
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

    // Populate categories
    catSelect.innerHTML = '<option value="">Selecione a categoria...</option>';
    Object.keys(CATALOGO_PONTOS).forEach(cat => {
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });

    // Update activities when category changes
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
 * Update points preview when activity is selected
 */
function updatePointsPreview() {
    const actSelect = document.getElementById('select-atividade');
    const preview = document.getElementById('points-preview');

    if (!actSelect || !preview) return;

    const selectedOption = actSelect.options[actSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.pontos) {
        const pontos = selectedOption.dataset.pontos;
        preview.textContent = `+${pontos} pts`;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }
}

/**
 * Setup event listeners
 */
function setupAdminEventListeners() {
    // Member search
    const searchInput = document.getElementById('admin-member-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            adminSearchQuery = e.target.value.toLowerCase();
            renderMemberSelectList();
        }, 200));
    }

    // Submit form
    const submitBtn = document.getElementById('btn-submit-points');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitPoints);
    }
}

/**
 * Render the member selection list
 */
function renderMemberSelectList() {
    const tbody = document.getElementById('member-select-body');
    if (!tbody) return;

    let members = [...MOCK_MEMBERS].filter(m => m.role !== 'pendente');

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
      <tr class="${isSelected ? 'selected' : ''}" onclick="toggleMemberSelection('${m.uid}')">
        <td style="width: 40px; text-align: center;">
          <input type="checkbox" class="member-checkbox" ${isSelected ? 'checked' : ''} 
            onclick="event.stopPropagation(); toggleMemberSelection('${m.uid}')">
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

    // Update selected count
    const countEl = document.getElementById('selected-count');
    if (countEl) {
        countEl.textContent = `${selectedMembers.size} membro(s) selecionado(s)`;
    }
}

/**
 * Toggle member selection
 * @param {string} uid
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
    const allMembers = MOCK_MEMBERS.filter(m => m.role !== 'pendente');

    if (selectedMembers.size === allMembers.length) {
        selectedMembers.clear();
    } else {
        allMembers.forEach(m => selectedMembers.add(m.uid));
    }

    renderMemberSelectList();
}

/**
 * Submit points to selected members
 */
function submitPoints() {
    const categoria = document.getElementById('select-categoria').value;
    const atividade = document.getElementById('select-atividade').value;
    const descricao = document.getElementById('input-descricao').value;
    const dataInput = document.getElementById('input-data').value;

    // Validation
    if (selectedMembers.size === 0) {
        showToast('Selecione pelo menos um membro.', 'error');
        return;
    }
    if (!categoria) {
        showToast('Selecione uma categoria.', 'error');
        return;
    }
    if (!atividade) {
        showToast('Selecione uma atividade.', 'error');
        return;
    }

    const pontos = getPontosAtividade(categoria, atividade);
    const data = dataInput ? new Date(dataInput) : new Date();
    const semestreId = getSemestreAtual(data);
    const user = getCurrentUser();

    // Create mock transactions
    selectedMembers.forEach(uid => {
        const member = MOCK_MEMBERS.find(m => m.uid === uid);
        if (!member) return;

        const transaction = {
            id: generateId(),
            userId: uid,
            adminId: user.uid,
            adminNome: user.nome,
            categoria: categoria,
            atividade: atividade,
            descricao: descricao || atividade,
            pontos: pontos,
            data: data,
            semestreId: semestreId
        };

        MOCK_TRANSACTIONS.push(transaction);

        // Update member cache (simulates FieldValue.increment)
        member.pontosTotais += pontos;
        if (member.semestreAtual === semestreId) {
            member.pontosSemestre += pontos;
        }
    });

    const memberNames = [...selectedMembers]
        .map(uid => MOCK_MEMBERS.find(m => m.uid === uid)?.nome)
        .filter(Boolean)
        .join(', ');

    showToast(`+${pontos} pts atribuídos a ${selectedMembers.size} membro(s): ${memberNames}`, 'success', 4000);

    // Reset form
    selectedMembers.clear();
    document.getElementById('select-categoria').value = '';
    document.getElementById('select-atividade').innerHTML = '<option value="">Selecione a atividade...</option>';
    document.getElementById('input-descricao').value = '';
    document.getElementById('points-preview').style.display = 'none';

    renderMemberSelectList();
    renderTransactionLog();
    renderManageMembers();
}

/**
 * Render the manage members section
 */
function renderManageMembers() {
    // Pending members
    const pendingMembers = MOCK_MEMBERS.filter(m => m.role === 'pendente');
    renderMemberStatusSection('pending', pendingMembers, 'Membros Pendentes', 'text-pending');

    // Active members
    const activeMembers = MOCK_MEMBERS.filter(m => m.role !== 'pendente' && getStatus(m.pontosSemestre).status === 'Ativo');
    renderMemberStatusSection('ativo', activeMembers, 'Membros Ativos', 'text-ativo');

    // Alert members
    const alertMembers = MOCK_MEMBERS.filter(m => m.role !== 'pendente' && getStatus(m.pontosSemestre).status === 'Em Alerta');
    renderMemberStatusSection('alerta', alertMembers, 'Membros em Alerta', 'text-alerta');

    // Inactive members
    const inactiveMembers = MOCK_MEMBERS.filter(m => m.role !== 'pendente' && getStatus(m.pontosSemestre).status === 'Inativo');
    renderMemberStatusSection('inativo', inactiveMembers, 'Membros Inativos', 'text-inativo');
}

/**
 * Render a member status section
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
        body.innerHTML = `
      <div style="padding: var(--space-lg); text-align: center;">
        <span class="text-muted" style="font-size: 0.85rem;">Nenhum membro nesta categoria.</span>
      </div>
    `;
        return;
    }

    body.innerHTML = `
    <table class="manage-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>E-mail</th>
          <th>Título</th>
          <th>Pts Semestre</th>
          ${id === 'pending' ? '<th>Ação</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${members.map(m => {
        const titulo = getTitulo(m.pontosTotais);
        return `
            <tr>
              <td style="font-weight: 600; color: var(--color-text-bright);">${m.nome}</td>
              <td><span class="mono text-muted" style="font-size: 0.75rem;">${m.email}</span></td>
              <td><span class="badge-title" style="font-size: 0.65rem;">${titulo.icone} ${titulo.titulo}</span></td>
              <td class="mono">${m.pontosSemestre} pts</td>
              ${id === 'pending' ? `
                <td>
                  <button class="btn btn-sm" onclick="approveMember('${m.uid}')">Aprovar</button>
                </td>
              ` : ''}
            </tr>
          `;
    }).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Approve a pending member
 * @param {string} uid
 */
function approveMember(uid) {
    const member = MOCK_MEMBERS.find(m => m.uid === uid);
    if (member) {
        member.role = 'membro';
        showToast(`${member.nome} aprovado como membro!`, 'success');
        renderManageMembers();
    }
}

/**
 * Render recent transaction log
 */
function renderTransactionLog() {
    const container = document.getElementById('transaction-log-body');
    if (!container) return;

    const recent = [...MOCK_TRANSACTIONS]
        .sort((a, b) => b.data - a.data)
        .slice(0, 20);

    if (recent.length === 0) {
        container.innerHTML = `
      <div style="padding: var(--space-lg); text-align: center;">
        <span class="text-muted">Nenhuma transação registrada.</span>
      </div>
    `;
        return;
    }

    container.innerHTML = recent.map(t => {
        const member = MOCK_MEMBERS.find(m => m.uid === t.userId);
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

// Set today's date as default for the date input
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initAdmin();
    setDefaultDate();
});
