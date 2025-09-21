<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>A KI PRI SA YÉ</title>
    <link rel="stylesheet" href="/dist/index.css" />
  </head>
  <body class="bg-gray-900 text-white min-h-screen">

    <header class="p-4 text-center text-2xl font-bold">
      🛒 Comparateur A KI PRI SA YÉ
    </header>

    <main class="p-4">
      <h2 class="text-xl mb-4">Produits en live</h2>
      <table id="product-list" class="w-full border text-sm text-left">
        <thead class="bg-gray-800">
          <tr>
            <th>#</th>
            <th>Produit</th>
            <th>Magasin</th>
            <th>Prix</th>
            <th>Tendance</th>
          </tr>
        </thead>
        <tbody>
          <!-- Les lignes Firestore vont s’ajouter ici automatiquement -->
        </tbody>
      </table>
    </main>

    <footer class="p-4 text-center text-gray-400">
      © <span id="y"></span> A KI PRI SA YÉ
    </footer>

    <!-- Script Firestore live -->
    <script type="module" src="/src/compare-live.js"></script>
    <script>
      // Année dynamique footer
      document.getElementById("y").textContent = new Date().getFullYear();
    </script>
  </body>
</html>
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "./firebase.js";

// Requête Firestore : derniers 25 produits
const q = query(
  collection(db, "products"),
  orderBy("updated", "desc"),
  limit(25)
);

// Écoute en direct
onSnapshot(q, (snap) => {
  const table = document.querySelector("#product-list tbody");

  // Nettoyer anciennes lignes
  [...table.querySelectorAll(".row")].forEach(el => el.remove());

  let i = 1;
  snap.forEach(doc => {
    table.appendChild(renderRow(i++, doc));
  });
});

// Création d'une ligne
function renderRow(i, doc) {
  const d = doc.data();
  const tr = document.createElement("tr");
  tr.className = "row";

  tr.innerHTML = `
    <td>${i}</td>
    <td>${d.name}</td>
    <td>${d.market}</td>
    <td>${d.price} €</td>
    <td class="${trendClass(d.trend)}">
      ${trendIcon(d.trend)} ${d.trend ?? "stable"}
    </td>
  `;

  return tr;
}

// Styles/flèches de tendance
function trendClass(trend) {
  if (trend === "up") return "text-green-500 font-bold";
  if (trend === "down") return "text-red-500 font-bold";
  return "text-gray-400";
}

function trendIcon(trend) {
  if (trend === "up") return "⬆️";
  if (trend === "down") return "⬇️";
  return "➡️";
}

