/* ============================================
   LICS Dashboard — Authentication (Stub)
   ============================================
   
   Este arquivo contém stubs para autenticação.
   A integração real com Firebase Auth será feita
   quando o projeto Firebase estiver configurado.
   
   ============================================ */

/**
 * Mock user for frontend development
 * Replace with Firebase Auth when ready
 */
const MOCK_USERS = {
    admin: {
        uid: 'admin-001',
        nome: 'LICS Admin',
        email: 'admin@unicamp.br',
        role: 'admin',
        pontosTotais: 0,
        pontosSemestre: 0
    },
    membro: {
        uid: 'user-001',
        nome: 'João Silva',
        email: 'j.silva@unicamp.br',
        role: 'membro',
        pontosTotais: 450,
        pontosSemestre: 85
    }
};

/**
 * Simulates getting the current user
 * In production, this would come from firebase.auth().currentUser
 * @returns {Object|null}
 */
function getCurrentUser() {
    // For development, return mock user based on URL param or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const mockRole = urlParams.get('role') || localStorage.getItem('lics_mock_role') || 'membro';
    return MOCK_USERS[mockRole] || MOCK_USERS.membro;
}

/**
 * Check if user is authenticated
 * Redirects to login page if not
 */
function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

/**
 * Check if user has admin role
 * @returns {boolean}
 */
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

/**
 * Check if user is pending approval
 * @returns {boolean}
 */
function isPending() {
    const user = getCurrentUser();
    return user && user.role === 'pendente';
}

/**
 * Simulates login
 * In production: firebase.auth().signInWithPopup(googleProvider)
 */
function doLogin() {
    // Mock: set role and redirect
    localStorage.setItem('lics_mock_role', 'membro');
    window.location.href = 'dashboard.html';
}

/**
 * Simulates admin login
 */
function doAdminLogin() {
    localStorage.setItem('lics_mock_role', 'admin');
    window.location.href = 'admin.html';
}

/**
 * Simulates logout
 * In production: firebase.auth().signOut()
 */
function doLogout() {
    localStorage.removeItem('lics_mock_role');
    window.location.href = 'index.html';
}

/**
 * Updates the header UI with user info
 * @param {Object} user
 */
function updateHeaderUser(user) {
    const nameEl = document.querySelector('.header-user-name');
    const roleEl = document.querySelector('.header-user-role');

    if (nameEl) nameEl.textContent = user.nome;
    if (roleEl) roleEl.textContent = user.role.toUpperCase();
}
