/**
 * Admin Dashboard - A KI PRI SA YÉ
 * Secure admin interface with authentication, role verification, and audit logging
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    where,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXX",  // À remplacer par la vraie clé
    authDomain: "a-ki-pri-sa-ye.firebaseapp.com",
    projectId: "a-ki-pri-sa-ye",
    storageBucket: "a-ki-pri-sa-ye.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin Security Configuration
const ADMIN_CONFIG = {
    maxLoginAttempts: 3,
    sessionTimeout: 60 * 60 * 1000, // 1 hour
    requireAdminRole: true,
    enableAuditLogging: true,
    enableSecurityAlerts: true
};

// Global state
let currentUser = null;
let sessionTimer = null;
let loginAttempts = 0;

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const loginForm = document.getElementById('login-form');
const adminDashboard = document.getElementById('admin-dashboard');
const loginError = document.getElementById('login-error');

// Security and Audit Functions
class AdminSecurity {
    static async logAdminAction(action, details = {}) {
        if (!ADMIN_CONFIG.enableAuditLogging) return;
        
        try {
            await addDoc(collection(db, 'admin_logs'), {
                action,
                details,
                userId: currentUser?.uid || 'anonymous',
                userEmail: currentUser?.email || 'unknown',
                timestamp: serverTimestamp(),
                ip: await this.getClientIP(),
                userAgent: navigator.userAgent,
                sessionId: this.getSessionId()
            });
        } catch (error) {
            console.error('Failed to log admin action:', error);
        }
    }

    static async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'unknown';
        }
    }

    static getSessionId() {
        let sessionId = sessionStorage.getItem('admin_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('admin_session_id', sessionId);
        }
        return sessionId;
    }

    static async checkSecurityStatus() {
        const securityChecks = {
            https: window.location.protocol === 'https:',
            firebase: !!auth.currentUser,
            sessionActive: !!sessionStorage.getItem('admin_session_id'),
            timestamp: Date.now()
        };

        await this.logAdminAction('security_check', securityChecks);
        return securityChecks;
    }

    static setupSessionTimeout() {
        if (sessionTimer) clearTimeout(sessionTimer);
        
        sessionTimer = setTimeout(() => {
            this.logAdminAction('session_timeout');
            this.forceLogout('Session expirée pour des raisons de sécurité');
        }, ADMIN_CONFIG.sessionTimeout);
    }

    static resetSessionTimeout() {
        this.setupSessionTimeout();
    }

    static async forceLogout(reason = 'Déconnexion') {
        await this.logAdminAction('force_logout', { reason });
        await signOut(auth);
        showLogin();
        showError(reason);
    }
}

// Authentication Functions
async function initializeAuth() {
    try {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Vérifier le rôle admin
                const token = await user.getIdTokenResult();
                const isAdmin = token.claims.admin || token.claims.premium; // Temporaire: premium = admin
                
                if (!isAdmin && ADMIN_CONFIG.requireAdminRole) {
                    await AdminSecurity.logAdminAction('unauthorized_access_attempt', {
                        userId: user.uid,
                        email: user.email
                    });
                    await signOut(auth);
                    showError('Accès non autorisé. Droits administrateur requis.');
                    return;
                }

                currentUser = user;
                await AdminSecurity.logAdminAction('admin_login_success', {
                    loginMethod: 'email_password'
                });
                
                AdminSecurity.setupSessionTimeout();
                showDashboard();
                await loadDashboardData();
                
            } else {
                currentUser = null;
                showLogin();
            }
            
            hideLoading();
        });
    } catch (error) {
        console.error('Auth initialization error:', error);
        hideLoading();
        showError('Erreur d\'initialisation de l\'authentification');
    }
}

async function handleLogin(email, password, rememberMe = false) {
    try {
        // Vérifier le nombre de tentatives
        if (loginAttempts >= ADMIN_CONFIG.maxLoginAttempts) {
            throw new Error('Trop de tentatives de connexion. Veuillez réessayer plus tard.');
        }

        // Configurer la persistance
        const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
        await setPersistence(auth, persistence);

        // Tentative de connexion
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        loginAttempts = 0; // Reset sur succès

        await AdminSecurity.logAdminAction('login_attempt', {
            email,
            success: true,
            rememberMe
        });

    } catch (error) {
        loginAttempts++;
        
        await AdminSecurity.logAdminAction('login_attempt', {
            email,
            success: false,
            error: error.code,
            attemptNumber: loginAttempts
        });

        let errorMessage = 'Erreur de connexion. ';
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage += 'Email ou mot de passe incorrect.';
                break;
            case 'auth/too-many-requests':
                errorMessage += 'Trop de tentatives. Compte temporairement verrouillé.';
                break;
            case 'auth/network-request-failed':
                errorMessage += 'Erreur réseau. Vérifiez votre connexion.';
                break;
            default:
                errorMessage += error.message;
        }
        
        throw new Error(errorMessage);
    }
}

// UI Functions
function showLoading() {
    loadingScreen.style.display = 'flex';
    loginForm.style.display = 'none';
    adminDashboard.style.display = 'none';
}

function hideLoading() {
    loadingScreen.style.display = 'none';
}

function showLogin() {
    hideLoading();
    loginForm.style.display = 'block';
    adminDashboard.style.display = 'none';
}

function showDashboard() {
    hideLoading();
    loginForm.style.display = 'none';
    adminDashboard.style.display = 'block';
    
    // Mettre à jour les informations utilisateur
    if (currentUser) {
        document.getElementById('admin-name').textContent = 
            currentUser.displayName || currentUser.email.split('@')[0];
        document.getElementById('last-login').textContent = 
            'Dernière connexion: ' + new Date().toLocaleString('fr-FR');
    }
}

function showError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
    setTimeout(() => {
        loginError.style.display = 'none';
    }, 5000);
}

// Dashboard Data Loading
async function loadDashboardData() {
    try {
        await Promise.all([
            loadUserStats(),
            loadRecentActivity(),
            loadSecurityStatus(),
            loadAuditLogs()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Erreur lors du chargement des données');
    }
}

async function loadUserStats() {
    try {
        // Simuler le chargement des statistiques (à remplacer par de vraies requêtes)
        document.getElementById('stats-users').textContent = '1,247';
        document.getElementById('stats-premium').textContent = '89';
        document.getElementById('stats-connections').textContent = '156';
        document.getElementById('stats-security').textContent = '✅ OK';
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

async function loadRecentActivity() {
    try {
        const activityContainer = document.getElementById('recent-activity');
        
        // Charger les logs récents depuis Firestore
        const logsQuery = query(
            collection(db, 'admin_logs'),
            orderBy('timestamp', 'desc'),
            limit(5)
        );
        
        const snapshot = await getDocs(logsQuery);
        const activities = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            activities.push({
                time: data.timestamp?.toDate() || new Date(),
                text: this.formatActivityText(data.action, data.details)
            });
        });

        if (activities.length > 0) {
            activityContainer.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <span class="activity-time">${this.formatTimeAgo(activity.time)}</span>
                    <span class="activity-text">${activity.text}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

async function loadSecurityStatus() {
    const status = await AdminSecurity.checkSecurityStatus();
    
    // Mettre à jour l'affichage du statut de sécurité
    const statusElement = document.getElementById('stats-security');
    if (status.https && status.firebase && status.sessionActive) {
        statusElement.textContent = '✅ OK';
        statusElement.className = 'stat-status';
    } else {
        statusElement.textContent = '⚠️ Attention';
        statusElement.className = 'stat-status status-warning';
    }
}

async function loadAuditLogs() {
    try {
        const logsContainer = document.getElementById('logs-container');
        
        const logsQuery = query(
            collection(db, 'admin_logs'),
            orderBy('timestamp', 'desc'),
            limit(20)
        );
        
        const snapshot = await getDocs(logsQuery);
        const logs = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            logs.push({
                timestamp: data.timestamp?.toDate() || new Date(),
                level: this.getLogLevel(data.action),
                message: this.formatLogMessage(data.action, data.details, data.userEmail)
            });
        });

        if (logs.length > 0) {
            logsContainer.innerHTML = logs.map(log => `
                <div class="log-entry">
                    <span class="log-time">${log.timestamp.toLocaleString('fr-FR')}</span>
                    <span class="log-level log-${log.level}">${log.level.toUpperCase()}</span>
                    <span class="log-message">${log.message}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading audit logs:', error);
    }
}

// Utility Functions
function formatActivityText(action, details) {
    switch (action) {
        case 'admin_login_success':
            return 'Connexion administrateur réussie';
        case 'user_created':
            return 'Nouvel utilisateur inscrit';
        case 'security_check':
            return 'Vérification de sécurité effectuée';
        default:
            return `Action: ${action}`;
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
}

function getLogLevel(action) {
    if (action.includes('error') || action.includes('failed')) return 'error';
    if (action.includes('unauthorized') || action.includes('security')) return 'warning';
    return 'info';
}

function formatLogMessage(action, details, userEmail) {
    switch (action) {
        case 'admin_login_success':
            return `Connexion administrateur réussie - ${userEmail}`;
        case 'login_attempt':
            return details.success 
                ? `Connexion réussie - ${details.email}`
                : `Échec de connexion - ${details.email}`;
        case 'unauthorized_access_attempt':
            return `Tentative d'accès non autorisé - ${details.email}`;
        default:
            return `${action} - ${userEmail}`;
    }
}

// Navigation Functions
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.admin-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.dataset.section;
            
            // Mettre à jour la navigation active
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Afficher la section appropriée
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`section-${targetSection}`).classList.add('active');
            
            // Logger l'action
            AdminSecurity.logAdminAction('navigation', { section: targetSection });
            AdminSecurity.resetSessionTimeout();
        });
    });
}

// Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        try {
            showLoading();
            await handleLogin(email, password, rememberMe);
        } catch (error) {
            hideLoading();
            showError(error.message);
        }
    });
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await AdminSecurity.logAdminAction('admin_logout');
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
        document.documentElement.classList.toggle('light');
        const themeBtn = document.getElementById('theme-toggle');
        themeBtn.textContent = document.documentElement.classList.contains('light') ? '☀️' : '🌙';
        AdminSecurity.resetSessionTimeout();
    });
    
    // Activity monitoring (reset session on user activity)
    ['click', 'keypress', 'mousemove'].forEach(eventType => {
        document.addEventListener(eventType, () => {
            if (currentUser) {
                AdminSecurity.resetSessionTimeout();
            }
        }, { passive: true });
    });
    
    // Settings save button
    document.getElementById('save-settings').addEventListener('click', async () => {
        await AdminSecurity.logAdminAction('settings_updated');
        showError('Paramètres sauvegardés avec succès');
    });
    
    // Refresh logs button
    document.getElementById('refresh-logs').addEventListener('click', async () => {
        await loadAuditLogs();
        AdminSecurity.resetSessionTimeout();
    });
}

// Security Headers and CSP
function setupSecurity() {
    // Prevent embedding in iframe
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }
    
    // Disable right-click in production
    if (location.hostname !== 'localhost') {
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());
    }
    
    // Log security events
    window.addEventListener('beforeunload', () => {
        if (currentUser) {
            AdminSecurity.logAdminAction('session_end');
        }
    });
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        setupSecurity();
        setupEventListeners();
        setupNavigation();
        await initializeAuth();
    } catch (error) {
        console.error('App initialization error:', error);
        hideLoading();
        showError('Erreur d\'initialisation de l\'application');
    }
});