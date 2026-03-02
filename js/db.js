/* ============================================
   LICS Dashboard — Firestore Database Module
   ============================================
   Centralized module for all read/write
   Firestore operations.
   ============================================ */

import { db } from './firebase-init.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, writeBatch, increment, Timestamp, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getSemestreAtual } from './utils.js';

// Collection references
const usersRef = collection(db, 'users');
const transactionsRef = collection(db, 'transactions');

/**
 * Fetch all members (excludes pending for non-admins)
 * @param {boolean} includesPending - If true, include pending members
 * @returns {Promise<Array>}
 */
export async function fetchAllMembers(includesPending = false) {
    const snapshot = await getDocs(usersRef);
    const members = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        data.uid = docSnap.id;
        if (includesPending || (data.role !== 'pendente' && data.role !== 'bloqueado')) {
            members.push(data);
        }
    });
    return members;
}

/**
 * Fetch a member by UID
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export async function fetchMemberByUid(uid) {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
        const data = docSnap.data();
        data.uid = docSnap.id;
        return data;
    }
    return null;
}

/**
 * Fetch transactions, optionally filtered by userId
 * @param {string|null} userId - If provided, filter by userId
 * @param {number} maxResults - Max results limit
 * @returns {Promise<Array>}
 */
export async function fetchTransactions(userId = null, maxResults = 50) {
    let q;
    if (userId) {
        q = query(transactionsRef, where('userId', '==', userId), orderBy('data', 'desc'), limit(maxResults));
    } else {
        q = query(transactionsRef, orderBy('data', 'desc'), limit(maxResults));
    }

    const snapshot = await getDocs(q);
    const transactions = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        data.id = docSnap.id;
        // Convert Timestamp to Date
        if (data.data && data.data.toDate) {
            data.data = data.data.toDate();
        }
        transactions.push(data);
    });
    return transactions;
}

/**
 * Create user document on first login (role 'pendente')
 * @param {string} uid
 * @param {string} nome
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function createUserDoc(uid, nome, email) {
    const semestreAtual = getSemestreAtual();
    await setDoc(doc(db, 'users', uid), {
        nome: nome,
        email: email,
        role: 'pendente',
        slug: nome.toLowerCase().replace(/\s+/g, ''),
        pontosTotais: 0,
        pontosSemestre: 0,
        semestreAtual: semestreAtual
    });
}

/**
 * Approve a pending member (change role to 'membro')
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function approveMember(uid) {
    await updateDoc(doc(db, 'users', uid), { role: 'membro' });
}

/**
 * Submit points to multiple members (atomic batch write)
 * Creates immutable transactions and increments member points
 * @param {Array<string>} uids - List of member UIDs
 * @param {Object} transactionData - Activity data
 * @param {Object} admin - Logged-in admin data {uid, nome}
 * @returns {Promise<void>}
 */
export async function submitPointsBatch(uids, transactionData, admin) {
    const batch = writeBatch(db);
    const semestreAtual = getSemestreAtual();

    for (const uid of uids) {
        // 1. Create document in transactions collection (immutable ledger)
        const txRef = doc(transactionsRef);
        batch.set(txRef, {
            userId: uid,
            adminId: admin.uid,
            adminNome: admin.nome,
            categoria: transactionData.categoria,
            atividade: transactionData.atividade,
            descricao: transactionData.descricao || transactionData.atividade,
            pontos: transactionData.pontos,
            data: transactionData.data ? Timestamp.fromDate(new Date(transactionData.data)) : serverTimestamp(),
            semestreId: transactionData.semestreId || semestreAtual
        });

        // 2. Increment points in member document
        const userRef = doc(db, 'users', uid);
        batch.update(userRef, {
            pontosTotais: increment(transactionData.pontos),
            pontosSemestre: increment(transactionData.pontos)
        });
    }

    // Execute atomically
    await batch.commit();
}

/**
 * Reject a pending member (delete Firestore doc)
 * User can re-register in the future
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function rejectMember(uid) {
    await deleteDoc(doc(db, 'users', uid));
}

/**
 * Expel/block a member (change role to 'bloqueado')
 * Maintain history and data in Firestore
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function blockMember(uid) {
    await updateDoc(doc(db, 'users', uid), { role: 'bloqueado' });
}

/**
 * Lazy Reset — verify if the semester changed and reset pontosSemestre
 * Called automatically when admin loads the dashboard
 * @returns {Promise<boolean>} true if reset was executed
 */
export async function checkAndResetSemestre() {
    const semestreAtual = getSemestreAtual();
    const snapshot = await getDocs(usersRef);

    // Verify if any member has a different semester
    let needsReset = false;
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.role !== 'pendente' && data.role !== 'bloqueado' && data.semestreAtual !== semestreAtual) {
            needsReset = true;
        }
    });

    if (!needsReset) return false;

    // Execute reset via batch
    const batch = writeBatch(db);
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.role !== 'pendente' && data.role !== 'bloqueado') {
            batch.update(doc(db, 'users', docSnap.id), {
                pontosSemestre: 0,
                semestreAtual: semestreAtual
            });
        }
    });

    await batch.commit();
    return true;
}
