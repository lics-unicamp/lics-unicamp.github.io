/* ============================================
   LICS Dashboard — Authentication Module
   ============================================
   Firebase Auth with Google Sign-In
   Allowed domains: @dac.unicamp.br + lics.unicamp@gmail.com
   ============================================ */

import { auth, provider } from './firebase-init.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { createUserDoc, fetchMemberByUid } from './db.js';
import { showToast } from './utils.js';

// Allowed domains
const ALLOWED_DOMAINS = ['dac.unicamp.br'];
const ADMIN_EMAILS = ['lics.unicamp@gmail.com', 'lics@unicamp.br'];

// LOCAL TESTING FLAG (DISABLE BEFORE DEPLOYMENT)
const BYPASS_AUTH = false; 

const MOCK_USER = {
    uid: 'local-mock-uid',
    nome: 'Tester Local (Admin)',
    email: 'tester@dac.unicamp.br',
    role: 'admin',
    pontosTotais: 1337,
    pontosSemestre: 80,
    semestreAtual: '2026.1'
};

// Session management constants
const SESSION_KEY = 'lics_session_start';
const SESSION_MAX_MS = 1 * 60 * 60 * 1000; // 1 hour

// Cached user data (Firestore)
let currentUserData = BYPASS_AUTH ? MOCK_USER : null;
let authReady = BYPASS_AUTH;
let authReadyResolve = null;
const authReadyPromise = new Promise(resolve => { 
    authReadyResolve = resolve; 
    if (BYPASS_AUTH) resolve(MOCK_USER);
});

/**
 * Check if the email is allowed
 * @param {string} email
 * @returns {boolean}
 */
function isEmailAllowed(email) {
    if (!email) return false;
    if (ADMIN_EMAILS.includes(email)) return true;
    return ALLOWED_DOMAINS.some(domain => email.endsWith(`@${domain}`));
}

/**
 * Return the logged-in user data from cache
 * @returns {Object|null}
 */
export function getCurrentUser() {
    return currentUserData;
}

/**
 * Wait for auth to be ready (onAuthStateChanged)
 * @returns {Promise<Object|null>}
 */
export function waitForAuth() {
    return authReadyPromise;
}

/**
 * Check if the user is an admin
 * @returns {boolean}
 */
export function isAdmin() {
    return currentUserData && currentUserData.role === 'admin';
}

/**
 * Check if the user is pending
 * @returns {boolean}
 */
export function isPending() {
    return currentUserData && currentUserData.role === 'pendente';
}

/**
 * Google Login
 * Flow: Google Sign-In -> Verify domain -> Verify/create Firestore doc
 */
export async function doLogin() {
    if (BYPASS_AUTH) {
        window.location.href = 'dashboard.html';
        return;
    }
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Verify email domain
        if (!isEmailAllowed(user.email)) {
            await signOut(auth);
            showToast('Acesso restrito a membros LICS (@dac.unicamp.br)', 'error', 5000);
            return;
        }

        // Verify if the doc exists in Firestore
        let userData = await fetchMemberByUid(user.uid);

        if (!userData) {
            // First login - create doc as 'pendente'
            await createUserDoc(user.uid, user.displayName || user.email.split('@')[0], user.email);
            userData = await fetchMemberByUid(user.uid);
        }

        // Record session start
        sessionStorage.setItem(SESSION_KEY, Date.now().toString());
        currentUserData = userData;

        // Redirect based on role
        if (userData.role === 'pendente') {
            window.location.href = 'index.html?status=pendente';
        } else if (userData.role === 'bloqueado') {
            await signOut(auth);
            window.location.href = 'index.html?status=bloqueado';
        } else {
            window.location.href = 'dashboard.html';
        }

    } catch (error) {
        console.error('Erro no login:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            return; // User closed the popup
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
 * Protect a page - redirect if not authenticated
 * @param {boolean} requireAdminRole - If true, requires 'admin' role
 * @returns {Promise<Object|null>} user data or null
 */
export async function requireAuth(requireAdminRole = false) {
    if (BYPASS_AUTH) {
        document.body.style.display = '';
        return MOCK_USER;
    }
    const userData = await waitForAuth();

    if (!userData) {
        window.location.href = 'index.html';
        return null;
    }

    if (userData.role === 'pendente') {
        window.location.href = 'index.html?status=pendente';
        return null;
    }

    if (userData.role === 'bloqueado') {
        window.location.href = 'index.html?status=bloqueado';
        return null;
    }

    if (requireAdminRole && userData.role !== 'admin') {
        window.location.href = 'dashboard.html';
        return null;
    }

    // Authentication successful, reveal the page
    document.body.style.display = '';

    return userData;
}

/**
 * Update the header with user info
 * @param {Object} user
 */
export function updateHeaderUser(user) {
    const nameEl = document.querySelector('.header-user-name');
    const roleEl = document.querySelector('.header-user-role');

    if (nameEl) nameEl.textContent = user.nome;
    if (roleEl) roleEl.textContent = user.role.toUpperCase();
}

/**
 * Initialize Firebase Auth listener
 * Called automatically when the module is imported
 */
function initAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            // Check session timeout
            const sessionStart = sessionStorage.getItem(SESSION_KEY);
            if (sessionStart && (Date.now() - parseInt(sessionStart, 10)) > SESSION_MAX_MS) {
                // Session TTL exceeded — force logout
                sessionStorage.removeItem(SESSION_KEY);
                await signOut(auth);
                currentUserData = null;
                authReady = true;
                authReadyResolve(null);
                return;
            }
            // Initialize session key if not set (new login or existing session)
            if (!sessionStart) {
                sessionStorage.setItem(SESSION_KEY, Date.now().toString());
            }

            // User is logged in - fetch Firestore data
            const userData = await fetchMemberByUid(firebaseUser.uid);
            currentUserData = userData;
        } else {
            sessionStorage.removeItem(SESSION_KEY);
            currentUserData = null;
        }
        authReady = true;
        authReadyResolve(currentUserData);
    });
}

// Initialize listener on load
initAuthListener();

// Expose functions for HTML onclick
window.doLogin = doLogin;
window.doLogout = doLogout;
