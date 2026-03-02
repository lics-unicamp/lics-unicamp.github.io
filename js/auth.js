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
const ADMIN_EMAIL = 'lics.unicamp@gmail.com';

// Cached user datav (Firestore)
let currentUserData = null;
let authReady = false;
let authReadyResolve = null;
const authReadyPromise = new Promise(resolve => { authReadyResolve = resolve; });

/**
 * Check if the email is allowed
 * @param {string} email
 * @returns {boolean}
 */
function isEmailAllowed(email) {
    if (!email) return false;
    if (email === ADMIN_EMAIL) return true;
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
            // User is logged in - fetch Firestore data
            const userData = await fetchMemberByUid(firebaseUser.uid);
            currentUserData = userData;
        } else {
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
