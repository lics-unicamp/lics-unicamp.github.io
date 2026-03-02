/* ============================================
   LICS Dashboard — Firestore Database Module
   ============================================
   Módulo centralizado para todas as operações
   de leitura e escrita no Firestore.
   ============================================ */

import { db } from './firebase-init.js';
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc,
    query, where, orderBy, limit, writeBatch, increment, Timestamp, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getSemestreAtual } from './utils.js';

// Referências das coleções
const usersRef = collection(db, 'users');
const transactionsRef = collection(db, 'transactions');

/**
 * Buscar todos os membros (exclui pendentes para não-admins)
 * @param {boolean} includesPending - Se true, inclui membros pendentes
 * @returns {Promise<Array>}
 */
export async function fetchAllMembers(includesPending = false) {
    const snapshot = await getDocs(usersRef);
    const members = [];
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        data.uid = docSnap.id;
        if (includesPending || data.role !== 'pendente') {
            members.push(data);
        }
    });
    return members;
}

/**
 * Buscar um membro por UID
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
 * Buscar transações, opcionalmente filtradas por userId
 * @param {string|null} userId - Se fornecido, filtra por userId
 * @param {number} maxResults - Limite de resultados
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
        // Converte Timestamp para Date
        if (data.data && data.data.toDate) {
            data.data = data.data.toDate();
        }
        transactions.push(data);
    });
    return transactions;
}

/**
 * Criar documento do usuário no primeiro login (role 'pendente')
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
 * Aprovar um membro pendente (mudar role para 'membro')
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function approveMember(uid) {
    await updateDoc(doc(db, 'users', uid), { role: 'membro' });
}

/**
 * Lançar pontos para múltiplos membros (batch write atômico)
 * Cria transações imutáveis + incrementa pontos nos documentos dos membros
 * @param {Array<string>} uids - Lista de UIDs dos membros
 * @param {Object} transactionData - Dados da atividade
 * @param {Object} admin - Dados do admin logado {uid, nome}
 * @returns {Promise<void>}
 */
export async function submitPointsBatch(uids, transactionData, admin) {
    const batch = writeBatch(db);
    const semestreAtual = getSemestreAtual();

    for (const uid of uids) {
        // 1. Criar documento na coleção transactions (ledger imutável)
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

        // 2. Incrementar pontos no documento do membro
        const userRef = doc(db, 'users', uid);
        batch.update(userRef, {
            pontosTotais: increment(transactionData.pontos),
            pontosSemestre: increment(transactionData.pontos)
        });
    }

    // Executa tudo atomicamente
    await batch.commit();
}
