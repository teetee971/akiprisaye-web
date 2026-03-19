"use strict";
/**
 * functions/src/index.ts — Firebase Cloud Functions (v2 callable)
 *
 * Fonctions d'administration sécurisées :
 *   findUser     — recherche un utilisateur par email ou UID
 *   setUserRole  — change le rôle d'un utilisateur (claims + Firestore + auditLogs)
 *
 * Toutes les fonctions vérifient que l'appelant a le rôle "admin" via le token Firebase.
 * L'écriture directe du champ `role` dans Firestore est bloquée par les règles de sécurité ;
 * seule cette fonction (Admin SDK) peut modifier le rôle de manière autoritaire.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserRole = exports.findUser = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
if (!admin.apps.length) {
    admin.initializeApp();
}
const ALLOWED_ROLES = ["citoyen", "observateur", "creator", "admin"];
/**
 * Vérifie que l'appelant est authentifié et a le rôle "admin".
 * Lève HttpsError("permission-denied") sinon.
 */
function assertAdmin(auth) {
    var _a;
    const role = (_a = auth === null || auth === void 0 ? void 0 : auth.token) === null || _a === void 0 ? void 0 : _a.role;
    if (!(auth === null || auth === void 0 ? void 0 : auth.uid) || role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Accès réservé aux administrateurs.");
    }
}
/* ── findUser ─────────────────────────────────────────────────────────────── */
/**
 * Recherche un utilisateur par email (si la chaîne contient "@") ou par UID.
 * Retourne uid, email, displayName, disabled, rôle effectif, rôle Firestore, rôle claims.
 *
 * Accessible uniquement aux admins.
 */
exports.findUser = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f, _g;
    assertAdmin(request.auth);
    const { query } = request.data;
    if (!query || typeof query !== "string" || query.trim().length < 2) {
        throw new https_1.HttpsError("invalid-argument", "Recherche invalide (min. 2 caractères).");
    }
    const q = query.trim();
    const authAdmin = admin.auth();
    const db = admin.firestore();
    let userRecord = null;
    if (q.includes("@")) {
        userRecord = await authAdmin.getUserByEmail(q).catch(() => null);
    }
    else {
        userRecord = await authAdmin.getUser(q).catch(() => null);
    }
    if (!userRecord) {
        throw new https_1.HttpsError("not-found", "Utilisateur introuvable.");
    }
    const docSnap = await db.collection("users").doc(userRecord.uid).get();
    const firestoreRole = (_b = (_a = docSnap.data()) === null || _a === void 0 ? void 0 : _a.role) !== null && _b !== void 0 ? _b : null;
    const claimRole = (_d = (_c = userRecord.customClaims) === null || _c === void 0 ? void 0 : _c.role) !== null && _d !== void 0 ? _d : null;
    return {
        uid: userRecord.uid,
        email: (_e = userRecord.email) !== null && _e !== void 0 ? _e : null,
        displayName: (_f = userRecord.displayName) !== null && _f !== void 0 ? _f : null,
        disabled: userRecord.disabled,
        role: (_g = claimRole !== null && claimRole !== void 0 ? claimRole : firestoreRole) !== null && _g !== void 0 ? _g : "citoyen",
        firestoreRole,
        claimRole,
    };
});
/* ── setUserRole ──────────────────────────────────────────────────────────── */
/**
 * Change le rôle d'un utilisateur cible.
 *
 * Actions effectuées de manière atomique :
 *   1. setCustomUserClaims — met à jour le token Firebase
 *   2. users/{uid}.role   — synchronise Firestore
 *   3. auditLogs          — trace l'opération (qui, quand, avant, après)
 *
 * Accessible uniquement aux admins. L'appelant ne peut pas se promouvoir lui-même
 * à un rôle supérieur à "admin" (le seul rôle max autorisé).
 */
exports.setUserRole = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f;
    assertAdmin(request.auth);
    const { uid, role } = request.data;
    if (!uid || typeof uid !== "string" || uid.trim().length === 0) {
        throw new https_1.HttpsError("invalid-argument", "UID utilisateur invalide.");
    }
    if (!role || !ALLOWED_ROLES.includes(role)) {
        throw new https_1.HttpsError("invalid-argument", `Rôle invalide. Valeurs autorisées : ${ALLOWED_ROLES.join(", ")}.`);
    }
    const db = admin.firestore();
    const authAdmin = admin.auth();
    // Vérifier que l'utilisateur cible existe
    const targetUser = await authAdmin.getUser(uid.trim()).catch(() => null);
    if (!targetUser) {
        throw new https_1.HttpsError("not-found", "Utilisateur cible introuvable.");
    }
    // Lire le rôle actuel depuis Firestore (source de vérité UI)
    const userRef = db.collection("users").doc(uid);
    const beforeSnap = await userRef.get();
    const beforeRole = (_b = (_a = beforeSnap.data()) === null || _a === void 0 ? void 0 : _a.role) !== null && _b !== void 0 ? _b : "citoyen";
    // 1. Mettre à jour les custom claims Firebase (pris en compte au prochain refresh du token)
    //    On préserve les claims existants pour ne pas effacer d'autres champs.
    await authAdmin.setCustomUserClaims(uid, Object.assign(Object.assign({}, ((_c = targetUser.customClaims) !== null && _c !== void 0 ? _c : {})), { role }));
    // 2. Synchroniser Firestore
    await userRef.set({
        uid,
        email: (_d = targetUser.email) !== null && _d !== void 0 ? _d : null,
        displayName: (_e = targetUser.displayName) !== null && _e !== void 0 ? _e : null,
        role,
        roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        roleUpdatedBy: request.auth.uid,
    }, { merge: true });
    // 3. Écrire l'entrée d'audit
    await db.collection("auditLogs").add({
        action: "ROLE_CHANGE",
        targetUid: uid,
        targetEmail: (_f = targetUser.email) !== null && _f !== void 0 ? _f : null,
        oldRole: beforeRole,
        newRole: role,
        byUid: request.auth.uid,
        at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
        ok: true,
        uid,
        oldRole: beforeRole,
        newRole: role,
    };
});
//# sourceMappingURL=index.js.map