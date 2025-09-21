/**
 * Admin Setup Script for A KI PRI SA YÉ
 * Utilities pour créer des administrateurs et tester la sécurité
 * Usage: node admin-setup.js
 */

const admin = require("firebase-admin");

// Configuration Firebase Admin SDK
const serviceAccount = {
  // À remplacer par les vraies clés de service account
  "type": "service_account",
  "project_id": "a-ki-pri-sa-ye",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@a-ki-pri-sa-ye.iam.gserviceaccount.com",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/service/account/cert"
};

// Initialiser Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();
const db = admin.firestore();

// Fonctions utilitaires
class AdminManager {
  
  /**
   * Créer un utilisateur administrateur
   */
  static async createAdminUser(email, password, displayName = null) {
    try {
      console.log(`🔧 Création de l'utilisateur admin: ${email}`);
      
      // Créer l'utilisateur
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: displayName || email.split('@')[0],
        emailVerified: true
      });
      
      console.log(`✅ Utilisateur créé avec UID: ${userRecord.uid}`);
      
      // Définir les rôles admin
      await this.setAdminRole(userRecord.uid);
      
      // Logger l'action
      await this.logAction('admin_user_created', {
        email,
        uid: userRecord.uid,
        displayName: userRecord.displayName
      });
      
      return userRecord;
      
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'admin:', error);
      throw error;
    }
  }
  
  /**
   * Définir le rôle administrateur pour un utilisateur
   */
  static async setAdminRole(uid) {
    try {
      console.log(`🔧 Attribution du rôle admin à: ${uid}`);
      
      const customClaims = {
        admin: true,
        premium: true,
        role: 'administrator',
        permissions: [
          'read_users',
          'write_users',
          'read_logs',
          'write_logs',
          'read_settings',
          'write_settings',
          'manage_security'
        ]
      };
      
      await auth.setCustomUserClaims(uid, customClaims);
      console.log('✅ Rôle admin défini avec succès');
      
      return customClaims;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'attribution du rôle:', error);
      throw error;
    }
  }
  
  /**
   * Définir le rôle premium pour un utilisateur
   */
  static async setPremiumRole(uid) {
    try {
      console.log(`🔧 Attribution du rôle premium à: ${uid}`);
      
      const customClaims = {
        premium: true,
        role: 'premium_user',
        permissions: [
          'read_premium_content',
          'advanced_features'
        ]
      };
      
      await auth.setCustomUserClaims(uid, customClaims);
      console.log('✅ Rôle premium défini avec succès');
      
      return customClaims;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'attribution du rôle premium:', error);
      throw error;
    }
  }
  
  /**
   * Lister tous les utilisateurs avec leurs rôles
   */
  static async listUsers(maxResults = 100) {
    try {
      console.log('📋 Récupération de la liste des utilisateurs...');
      
      const listUsersResult = await auth.listUsers(maxResults);
      const users = [];
      
      listUsersResult.users.forEach((userRecord) => {
        users.push({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          emailVerified: userRecord.emailVerified,
          disabled: userRecord.disabled,
          customClaims: userRecord.customClaims || {},
          metadata: {
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime
          }
        });
      });
      
      console.log(`✅ ${users.length} utilisateurs récupérés`);
      return users;
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }
  
  /**
   * Supprimer un utilisateur
   */
  static async deleteUser(uid) {
    try {
      console.log(`🗑️ Suppression de l'utilisateur: ${uid}`);
      
      await auth.deleteUser(uid);
      
      await this.logAction('admin_user_deleted', { uid });
      
      console.log('✅ Utilisateur supprimé avec succès');
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      throw error;
    }
  }
  
  /**
   * Créer la configuration de sécurité par défaut
   */
  static async setupDefaultSecurity() {
    try {
      console.log('🔒 Configuration de la sécurité par défaut...');
      
      const securityConfig = {
        maxLoginAttempts: 3,
        sessionTimeout: 60 * 60 * 1000, // 1 heure
        requireTwoFactor: false,
        allowedDomains: ['akiprisaye.com', 'akiprisaye.pages.dev'],
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false
        },
        auditLogging: {
          enabled: true,
          logLevel: 'INFO',
          retentionDays: 90
        }
      };
      
      await db.collection('admin_config').doc('security').set(securityConfig);
      
      console.log('✅ Configuration de sécurité créée');
      return securityConfig;
      
    } catch (error) {
      console.error('❌ Erreur lors de la configuration de sécurité:', error);
      throw error;
    }
  }
  
  /**
   * Logger une action admin
   */
  static async logAction(action, details = {}) {
    try {
      await db.collection('admin_logs').add({
        action,
        details,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        source: 'admin_setup_script',
        version: '1.0.0'
      });
    } catch (error) {
      console.error('❌ Erreur lors du logging:', error);
    }
  }
  
  /**
   * Vérifier l'état de la sécurité
   */
  static async checkSecurityStatus() {
    try {
      console.log('🔍 Vérification de l\'état de la sécurité...');
      
      const securityChecks = {
        timestamp: new Date().toISOString(),
        checks: {}
      };
      
      // Vérifier la configuration de sécurité
      const securityDoc = await db.collection('admin_config').doc('security').get();
      securityChecks.checks.securityConfig = securityDoc.exists;
      
      // Compter les admins
      const users = await this.listUsers();
      const adminCount = users.filter(u => u.customClaims.admin).length;
      securityChecks.checks.adminUsers = adminCount > 0;
      securityChecks.adminCount = adminCount;
      
      // Vérifier les logs récents
      const recentLogs = await db.collection('admin_logs')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      securityChecks.checks.auditLogging = !recentLogs.empty;
      
      console.log('🔍 État de la sécurité:', securityChecks);
      return securityChecks;
      
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de sécurité:', error);
      throw error;
    }
  }
  
  /**
   * Nettoyer les anciens logs (plus de 90 jours)
   */
  static async cleanupOldLogs() {
    try {
      console.log('🧹 Nettoyage des anciens logs...');
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      const oldLogsQuery = await db.collection('admin_logs')
        .where('timestamp', '<', cutoffDate)
        .limit(500)
        .get();
      
      if (oldLogsQuery.empty) {
        console.log('✅ Aucun ancien log à supprimer');
        return 0;
      }
      
      const batch = db.batch();
      oldLogsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`✅ ${oldLogsQuery.size} anciens logs supprimés`);
      return oldLogsQuery.size;
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      throw error;
    }
  }
}

// Menu interactif
async function showMenu() {
  console.log('\n🏛️ === A KI PRI SA YÉ - Admin Setup ===\n');
  console.log('1. Créer un utilisateur administrateur');
  console.log('2. Lister tous les utilisateurs');
  console.log('3. Définir le rôle admin pour un utilisateur existant');
  console.log('4. Définir le rôle premium pour un utilisateur existant');
  console.log('5. Configurer la sécurité par défaut');
  console.log('6. Vérifier l\'état de la sécurité');
  console.log('7. Nettoyer les anciens logs');
  console.log('8. Supprimer un utilisateur');
  console.log('0. Quitter\n');
}

// Interface en ligne de commande simple
async function main() {
  try {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (prompt) => new Promise(resolve => {
      readline.question(prompt, resolve);
    });
    
    while (true) {
      await showMenu();
      const choice = await question('Choisissez une option: ');
      
      switch (choice) {
        case '1':
          const email = await question('Email de l\'admin: ');
          const password = await question('Mot de passe: ');
          const displayName = await question('Nom d\'affichage (optionnel): ');
          await AdminManager.createAdminUser(email, password, displayName || null);
          break;
          
        case '2':
          const users = await AdminManager.listUsers();
          console.table(users.map(u => ({
            UID: u.uid.substring(0, 8) + '...',
            Email: u.email,
            Nom: u.displayName || 'N/A',
            Admin: u.customClaims.admin ? '✅' : '❌',
            Premium: u.customClaims.premium ? '✅' : '❌',
            Vérifié: u.emailVerified ? '✅' : '❌'
          })));
          break;
          
        case '3':
          const adminUid = await question('UID de l\'utilisateur: ');
          await AdminManager.setAdminRole(adminUid);
          break;
          
        case '4':
          const premiumUid = await question('UID de l\'utilisateur: ');
          await AdminManager.setPremiumRole(premiumUid);
          break;
          
        case '5':
          await AdminManager.setupDefaultSecurity();
          break;
          
        case '6':
          await AdminManager.checkSecurityStatus();
          break;
          
        case '7':
          await AdminManager.cleanupOldLogs();
          break;
          
        case '8':
          const deleteUid = await question('UID de l\'utilisateur à supprimer: ');
          const confirm = await question('Êtes-vous sûr? (oui/non): ');
          if (confirm.toLowerCase() === 'oui') {
            await AdminManager.deleteUser(deleteUid);
          }
          break;
          
        case '0':
          console.log('👋 Au revoir!');
          readline.close();
          process.exit(0);
          
        default:
          console.log('❌ Option invalide');
      }
      
      await question('\nAppuyez sur Entrée pour continuer...');
    }
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Démarrer si le script est exécuté directement
if (require.main === module) {
  main();
}

module.exports = AdminManager;