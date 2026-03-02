/* ============================================
   LICS Dashboard — Authentication Module
   ============================================
   Firebase Auth com Google Sign-In
   Domínios permitidos: @dac.unicamp.br + lics.unicamp@gmail.com
   ============================================ */

import { auth, provider } from './firebase-init.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { createUserDoc, fetchMemberByUid } from './db.js';
import { showToast } from './utils.js';

// Domínios permitidos
const ALLOWED_DOMAINS = ['dac.unicamp.br'];
const ADMIN_EMAIL = 'lics.unicamp@gmail.com';

// Cache do usuário atual (dados do Firestore)
let currentUserData = null;
let authReady = false;
let authReadyResolve = null;
const authReadyPromise = new Promise(resolve => { authReadyResolve = resolve; });

/**
 * Verifica se o e-mail é permitido
 * @param {string} email
 * @returns {boolean}
 */
function isEmailAllowed(email) {
    if (!email) return false;
    if (email === ADMIN_EMAIL) return true;
    return ALLOWED_DOMAINS.some(domain => email.endsWith(`@${domain}`));
}

/**
 * Retorna os dados do usuário logado (do Firestore cache)
 * @returns {Object|null}
 */
export function getCurrentUser() {
    return currentUserData;
}

/**
 * Aguarda o auth estar pronto (onAuthStateChanged)
 * @returns {Promise<Object|null>}
 */
export function waitForAuth() {
    return authReadyPromise;
}

/**
 * Verifica se o usuário é admin
 * @returns {boolean}
 */
export function isAdmin() {
    return currentUserData && currentUserData.role === 'admin';
}

/**
 * Verifica se o usuário está pendente
 * @returns {boolean}
 */
export function isPending() {
    return currentUserData && currentUserData.role === 'pendente';
}

/**
 * Login com Google
 * Fluxo: Google Sign-In → Verificar domínio → Verificar/criar doc Firestore
 */
export async function doLogin() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Verificar domínio do e-mail
        if (!isEmailAllowed(user.email)) {
            await signOut(auth);
            showToast('Acesso restrito a membros LICS (@dac.unicamp.br)', 'error', 5000);
            return;
        }

        // Verificar se o doc existe no Firestore
        let userData = await fetchMemberByUid(user.uid);

        if (!userData) {
            // Primeiro login — criar doc como 'pendente'
            await createUserDoc(user.uid, user.displayName || user.email.split('@')[0], user.email);
            userData = await fetchMemberByUid(user.uid);
        }

        currentUserData = userData;

        // Redirecionar baseado no role
        if (userData.role === 'pendente') {
            window.location.href = 'index.html?status=pendente';
        } else {
            window.location.href = 'dashboard.html';
        }

    } catch (error) {
        console.error('Erro no login:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            return; // Usuário fechou o popup — sem ação
        }
        showToast('Erro ao fazer login. Tente novamente.', 'error');
    }
}

/**
 * Logout
 */
export async function doLogout() {
    try {
        await signOut(auth);
        currentUserData = null;
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro no logout:', error);
        showToast('Erro ao fazer logout.', 'error');
    }
}

/**
 * Protege uma página — redireciona se não autenticado
 * @param {boolean} requireAdminRole - Se true, exige role 'admin'
 * @returns {Promise<Object|null>} dados do usuário ou null
 */
export async function requireAuth(requireAdminRole = false) {
    const userData = await waitForAuth();

    if (!userData) {
        window.location.href = 'index.html';
        return null;
    }

    if (userData.role === 'pendente') {
        window.location.href = 'index.html?status=pendente';
        return null;
    }

    if (requireAdminRole && userData.role !== 'admin') {
        window.location.href = 'dashboard.html';
        return null;
    }

    return userData;
}

/**
 * Atualiza o header com informações do usuário
 * @param {Object} user
 */
export function updateHeaderUser(user) {
    const nameEl = document.querySelector('.header-user-name');
    const roleEl = document.querySelector('.header-user-role');

    if (nameEl) nameEl.textContent = user.nome;
    if (roleEl) roleEl.textContent = user.role.toUpperCase();
}

/**
 * Inicializa listener do Firebase Auth
 * Chamado automaticamente quando o módulo é importado
 */
function initAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            // Usuário logado — buscar dados do Firestore
            const userData = await fetchMemberByUid(firebaseUser.uid);
            currentUserData = userData;
        } else {
            currentUserData = null;
        }
        authReady = true;
        authReadyResolve(currentUserData);
    });
}

// Inicializar listener ao carregar o módulo
initAuthListener();

// Expor funções para uso em onclick do HTML
window.doLogin = doLogin;
window.doLogout = doLogout;
