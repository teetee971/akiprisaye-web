import admin from "firebase-admin";
import fs from "fs";

// Init Firebase (même logique que plus haut)
const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./service-account.json";
const serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));
try { admin.app(); } catch { admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }); }

const db = admin.firestore();

// Petit helper distance (Haversine) pour afficher la distance km depuis un point donné
function distKm(a, b) {
  const toRad = d => d * Math.PI/180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

async function search({ productSlug, limit=20, startAfterDocId=null, origin=null }) {
  let q = db.collection("promotions")
            .where("product_slug", "==", productSlug)
            .orderBy("unit_price", "asc")
            .limit(limit);

  if (startAfterDocId) {
    const snap = await db.collection("promotions").doc(startAfterDocId).get();
    if (snap.exists) q = q.startAfter(snap);
  }

  const snap = await q.get();
  const items = snap.docs.map(d => {
    const x = { id: d.id, ...d.data() };
    if (origin && x.location) {
      x.distance_km = distKm(
        {lat: origin.lat, lng: origin.lng},
        {lat: x.location.latitude, lng: x.location.longitude}
      );
    }
    return x;
  });

  return {
    items,
    lastDocId: snap.docs.length ? snap.docs[snap.docs.length-1].id : null
  };
}

(async () => {
  // Exemple d’appel : lait entier près d’un point et tri par prix
  const origin = { lat: 16.265, lng: -61.551 }; // ta position approximative
  const { items, lastDocId } = await search({
    productSlug: "lait-entier-1l",
    limit: 10,
    origin
  });

  console.table(items.map(x => ({
    product: x.product_name,
    store: x.store_name,
    price: x.unit_price,
    end: x.end_date_iso,
    dist_km: x.distance_km?.toFixed(1) ?? "-"
  })));

  console.log("lastDocId:", lastDocId); // utile pour la pagination
})();
