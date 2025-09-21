/**
 * A KI PRI SA YÉ – Cloud Functions
 * Region: us-central1
 * Expose:
 *  - GET /getRanking?zone=martinique
 *  - GET /searchPrices?zone=martinique&q=banane&limit=50
 *  - POST /admin/setUserRole (Admin only)
 *  - GET /admin/getUsers (Admin only)
 *  - POST /admin/auditLog (Admin only)
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const axios     = require('axios');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

const REGION = 'us-central1';
const https  = functions.region(REGION).https;

/* --------- Admin Security Middleware --------- */
async function verifyAdminAuth(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
      return false;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Vérifier le rôle admin
    if (!decodedToken.admin && !decodedToken.premium) {
      res.status(403).json({ error: 'Forbidden: Admin role required' });
      return false;
    }

    req.user = decodedToken;
    return true;
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return false;
  }
}

/* --------- Audit Logging --------- */
async function logAdminAction(userId, action, details = {}, req = null) {
  try {
    await db.collection('admin_logs').add({
      userId,
      action,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ip: req ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress) : null,
      userAgent: req ? req.headers['user-agent'] : null
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

/* --------- CORS util --------- */
function handleCORS(req, res){
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(''); return true; }
  return false;
}

/* --------- normalisation texte --------- */
function norm(s=''){
  return s.toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu,'');
}

/* --------- zones connues --------- */
const ZONES = [
  'martinique','guadeloupe','guyane','reunion',
  'mayotte','saint-martin','saint-barthelemy',
  'saint-pierre-et-miquelon','polynesie-francaise','wallis-et-futuna'
];

/* =========================================================================
   HELPERS – Open Food Facts (produits) + Open Prices (prix)
   ========================================================================= */

async function offSearchProducts(q, limit=20){
  // API OFF: https://world.openfoodfacts.org/cgi/search.pl
  const url = 'https://world.openfoodfacts.org/cgi/search.pl';
  const params = {
    search_simple: 1,
    action: 'process',
    json: 1,
    page_size: Math.min(limit, 50),
    fields: 'code,product_name,brands,quantity,image_front_url'
  };
  // On split en mots-clés simple
  params.search_terms = q;

  const { data } = await axios.get(url, { params, timeout: 8000 });
  const items = Array.isArray(data.products) ? data.products : [];
  return items
    .filter(p => p.code && (p.product_name || p.brands))
    .map(p => ({
      barcode: p.code,
      name: p.product_name || '',
      brand: p.brands || '',
      quantity: p.quantity || '',
      image: p.image_front_url || ''
    }));
}

async function offPricesByBarcode(barcode){
  // API Open Prices : https://prices.openfoodfacts.org/api/docs
  // Par code-barres : /prices?code=<barcode>
  const base = 'https://prices.openfoodfacts.org/api/v1/prices';
  const { data } = await axios.get(base, { params: { code: barcode }, timeout: 8000 });
  // data.results : [{ price, currency, store, address, city, date, ... }, ...]
  const rows = Array.isArray(data?.results) ? data.results : [];
  return rows.map(r => ({
    price: Number(r.price),
    currency: r.currency || 'EUR',
    store: r.store || (r.retailer || ''),
    city: r.city || '',
    updatedAt: r.date ? new Date(r.date).getTime() : null
  }));
}

/* =========================================================================
   ADMIN ENDPOINTS – Gestion des utilisateurs et audit
   ========================================================================= */

// Définir le rôle d'un utilisateur (admin uniquement)
exports.setUserRole = https.onRequest(async (req, res) => {
  if (handleCORS(req, res)) return;
  
  if (!await verifyAdminAuth(req, res)) return;
  
  try {
    const { uid, role, premium } = req.body;
    
    if (!uid || typeof role !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid uid/role' });
    }
    
    const customClaims = {};
    
    // Définir les rôles
    if (role === 'admin') {
      customClaims.admin = true;
      customClaims.premium = true;
    } else if (role === 'premium') {
      customClaims.premium = true;
    }
    
    await admin.auth().setCustomUserClaims(uid, customClaims);
    
    await logAdminAction(req.user.uid, 'set_user_role', {
      targetUserId: uid,
      role,
      customClaims
    }, req);
    
    res.json({ 
      success: true, 
      message: `Role ${role} assigned to user ${uid}`,
      customClaims 
    });
    
  } catch (error) {
    console.error('Set user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir la liste des utilisateurs (admin uniquement)
exports.getUsers = https.onRequest(async (req, res) => {
  if (handleCORS(req, res)) return;
  
  if (!await verifyAdminAuth(req, res)) return;
  
  try {
    const { limit = 50, pageToken } = req.query;
    
    const listUsersResult = await admin.auth().listUsers(parseInt(limit), pageToken);
    
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      },
      customClaims: user.customClaims || {},
      providerData: user.providerData.map(p => ({
        providerId: p.providerId,
        uid: p.uid,
        email: p.email
      }))
    }));
    
    await logAdminAction(req.user.uid, 'get_users', {
      count: users.length,
      hasNextPage: !!listUsersResult.pageToken
    }, req);
    
    res.json({
      users,
      nextPageToken: listUsersResult.pageToken,
      totalCount: users.length
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir les logs d'audit (admin uniquement)
exports.getAuditLogs = https.onRequest(async (req, res) => {
  if (handleCORS(req, res)) return;
  
  if (!await verifyAdminAuth(req, res)) return;
  
  try {
    const { limit = 100, startAfter, filter } = req.query;
    
    let query = db.collection('admin_logs')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));
    
    if (startAfter) {
      const startDoc = await db.collection('admin_logs').doc(startAfter).get();
      query = query.startAfter(startDoc);
    }
    
    if (filter) {
      query = query.where('action', '==', filter);
    }
    
    const snapshot = await query.get();
    const logs = [];
    
    snapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()?.toISOString()
      });
    });
    
    await logAdminAction(req.user.uid, 'get_audit_logs', {
      count: logs.length,
      filter
    }, req);
    
    res.json({ logs });
    
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Obtenir les statistiques du tableau de bord (admin uniquement)
exports.getDashboardStats = https.onRequest(async (req, res) => {
  if (handleCORS(req, res)) return;
  
  if (!await verifyAdminAuth(req, res)) return;
  
  try {
    // Compter les utilisateurs
    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users;
    
    const totalUsers = users.length;
    const premiumUsers = users.filter(user => user.customClaims?.premium).length;
    const adminUsers = users.filter(user => user.customClaims?.admin).length;
    
    // Compter les connexions récentes (dernières 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLoginsQuery = await db.collection('admin_logs')
      .where('action', '==', 'admin_login_success')
      .where('timestamp', '>=', yesterday)
      .get();
    
    const recentLogins = recentLoginsQuery.size;
    
    // Vérifier les alertes de sécurité
    const securityAlertsQuery = await db.collection('admin_logs')
      .where('action', 'in', ['unauthorized_access_attempt', 'login_attempt'])
      .where('timestamp', '>=', yesterday)
      .get();
    
    let failedLogins = 0;
    securityAlertsQuery.forEach(doc => {
      const data = doc.data();
      if (data.action === 'login_attempt' && data.details?.success === false) {
        failedLogins++;
      } else if (data.action === 'unauthorized_access_attempt') {
        failedLogins++;
      }
    });
    
    const stats = {
      users: {
        total: totalUsers,
        premium: premiumUsers,
        admin: adminUsers,
        standard: totalUsers - premiumUsers
      },
      activity: {
        recentLogins,
        failedLogins
      },
      security: {
        status: failedLogins < 10 ? 'ok' : 'warning',
        alerts: failedLogins
      },
      timestamp: new Date().toISOString()
    };
    
    await logAdminAction(req.user.uid, 'get_dashboard_stats', stats, req);
    
    res.json(stats);
    
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* =========================================================================
   /searchPrices – recherche produit + agrégation des prix Open Prices
   ========================================================================= */
exports.searchPrices = https.onRequest(async (req, res) => {
  if (handleCORS(req, res)) return;
  try{
    const zone  = (req.query.zone || 'martinique').toString().toLowerCase().trim();
    const qRaw  = (req.query.q || '').toString().trim();
    const limit = Math.min(parseInt(req.query.limit)||20, 50);

    if(!qRaw) return res.status(400).json({ error: 'missing q' });
    if(!ZONES.includes(zone)) return res.status(400).json({ error: 'unknown zone' });

    // 1) Produits depuis OFF
    const products = await offSearchProducts(qRaw, limit);

    // 2) Pour chaque code-barres, tenter les prix Open Prices (en //)
    const priced = await Promise.all(products.map(async (p) => {
      try{
        const prices = await offPricesByBarcode(p.barcode);
        // on prend le prix le plus récent si dispo
        let best = null;
        for(const r of prices){
          if(!best || (r.updatedAt && r.updatedAt > best.updatedAt)) best = r;
        }
        return {
          ...p,
          price: best?.price ?? null,
          currency: best?.currency ?? 'EUR',
          store: best?.store ?? '',
          city: best?.city ?? '',
          updatedAt: best?.updatedAt ?? null
        };
      }catch(e){
        // pas de prix => renvoi produit seul
        return { ...p, price: null, currency: 'EUR', store: '', city: '', updatedAt: null };
      }
    }));

    // 3) Filtre simple texte sur nom/marque si besoin
    const q = norm(qRaw);
    const match = (s='') => norm(s).includes(q);
    const out = priced.filter(it => match(it.name) || match(it.brand));

    res.json({ zone, q: qRaw, count: out.length, items: out });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: 'server' });
  }
});

/* =========================================================================
   /getRanking – (ta version d’origine simplifiée) 
   NOTE: on garde le principe: lire Firestore (prices + prices_<zone>), 
   calculer un "panier moyen", etc. Si tu as déjà une version, tu peux
   la conserver. Voici un stub minimal pour éviter les erreurs.
   ========================================================================= */
exports.getRanking = https.onRequest(async (req, res) => {
  if (handleCORS(req, res)) return;
  try{
    const zone = (req.query.zone || 'martinique').toString().toLowerCase().trim();
    if(!ZONES.includes(zone)) return res.status(400).json({ error: 'unknown zone' });

    // Exemple très simple si la collection n’existe pas encore
    const snap = await db.collection('prices').where('zone','==', zone).limit(50).get();
    if(snap.empty){
      return res.json({ zone, rows: [], updatedAt: null });
    }

    // Regrouper par enseigne + faire une moyenne simple
    const rowsByStore = {};
    snap.forEach(doc => {
      const d = doc.data();
      const key = d.store || 'Inconnu';
      if(!rowsByStore[key]) rowsByStore[key] = { sum:0, n:0 };
      rowsByStore[key].sum += Number(d.price || 0);
      rowsByStore[key].n += 1;
    });

    const rows = Object.entries(rowsByStore)
      .map(([store,agg]) => ({
        store, avgBasket: agg.n ? agg.sum/agg.n : null, sampleSize: agg.n
      }))
      .sort((a,b) => (a.avgBasket ?? 1e9) - (b.avgBasket ?? 1e9));

    res.json({ zone, rows, updatedAt: null });
  }catch(e){
    console.error(e);
    res.status(500).json({ error: 'server' });
  }
});
