import functions from "firebase-functions";
import admin from "firebase-admin";
import cors from "cors";

try { admin.initializeApp(); } catch(e) {}
const c = cors({ origin: true });

export const ping = functions.https.onRequest((req, res) => {
  c(req, res, () => res.status(200).send("OK"));
});

export const prices = functions.https.onRequest((req, res) => {
  c(req, res, () => {
    res.json({
      items: [
        { id:"lait-1l", name:"Lait UHT 1L", price_dom:1.45, price_hex:1.12 },
        { id:"pates-500g", name:"Pâtes 500g", price_dom:1.36, price_hex:0.98 },
        { id:"riz-1kg", name:"Riz 1kg", price_dom:2.30, price_hex:1.85 }
      ]
    });
  });
});
