/* ============================================
   LICS Dashboard — Rules Page Logic
   ============================================ */

import { requireAuth, updateHeaderUser, isAdmin } from './auth.js';
import { CATALOGO_PONTOS, TITULOS } from './utils.js';

/**
 * Initialize the Rules page
 */
async function initRules() {
    const user = await requireAuth();
    if (!user) return;

    updateHeaderUser(user);

    // Show admin link if admin
    if (isAdmin()) {
        const navAdmin = document.getElementById('nav-admin');
        if (navAdmin) navAdmin.style.display = 'inline-flex';
    }

    renderTitles();
    renderCategories();
}

/**
 * Render LICS Titles/Ranks
 */
function renderTitles() {
    const container = document.getElementById('titles-grid');
    if (!container) return;

    // Sort by points ascending to show progression
    const sortedTitles = [...TITULOS].sort((a, b) => a.min - b.min);

    container.innerHTML = sortedTitles.map(t => `
        <div class="title-card">
            <div class="title-icon">${t.icone}</div>
            <span class="title-name">${t.titulo}</span>
            <span class="title-range">${t.min === 1001 ? '+1000' : (t.min + ' pts')}</span>
        </div>
    `).join('');
}

/**
 * Render Scoring Categories and Activities
 */
function renderCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    const categories = Object.keys(CATALOGO_PONTOS);

    container.innerHTML = categories.map(cat => `
        <div class="category-card">
            <h3 class="category-title">${cat}</h3>
            <div class="rule-list">
                ${CATALOGO_PONTOS[cat].map(rule => `
                    <div class="rule-item">
                        <span class="rule-name">${rule.nome}</span>
                        <span class="rule-points" style="color: ${rule.pontos > 0 ? 'var(--color-success)' : 'var(--color-danger)'}">
                            ${rule.pontos > 0 ? '+' : ''}${rule.pontos} pts
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initRules);
