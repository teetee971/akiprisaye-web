#!/usr/bin/env bash
set -euo pipefail

# =========================
#  A KI PRI SA YÉ – INIT
#  (seed + outils + backup/restore)
# =========================

# --- Paramètres projet / endpoints ---
PROJECT_ID="a-ki-pri-sa-ye"
REGION="us-central1"
BASE_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net"

# --- Fichiers / dossiers ---
ROOT_DIR="${HOME}/akiprisaye-web"
FUN_DIR="${ROOT_DIR}/functions"
TOOLS_DIR="${FUN_DIR}/tools"
BACKUP_DIR="${ROOT_DIR}/backups"
SA_FILE="${FUN_DIR}/serviceAccount.json"

mkdir -p "${FUN_DIR}" "${TOOLS_DIR}" "${BACKUP_DIR}"

# --- Dépendances ---
ensure_deps() {
  cd "${FUN_DIR}"
  npm i --silent firebase-admin axios >/dev/null 2>&1 || npm i firebase-admin axios
}

# --- Service Account ---
reload_sa() {
  echo "Chemin du JSON de compte de service (ex: ~/storage/downloads/xxx.json)"
  read -r -p "> " SRC
  if [ ! -f "${SRC}" ]; then
    echo "❌ Fichier introuvable: ${SRC}"; return 1
  fi
  cp "${SRC}" "${SA_FILE}"
  echo "✅ Copié vers ${SA_FILE}"
  export GOOGLE_APPLICATION_CREDENTIALS="${SA_FILE}"
}

use_sa_if_exists() {
  if [ -f "${SA_FILE}" ]; then
    export GOOGLE_APPLICATION_CREDENTIALS="${SA_FILE}"
  fi
}

# --- Seed Firestore (produits tests x zones DROM+COM) ---
seed_firestore() {
  use_sa_if_exists
  if [ ! -f "${SA_FILE}" ]; then
    echo "❌ ${SA_FILE} manquant. Choisis l'option 2 pour charger la clé."
    return 1
  fi

  node - <<'NODE'
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

const ZONES = [
  "guadeloupe","martinique","guyane","reunion","mayotte",
  "saint-pierre-et-miquelon","saint-barthelemy","saint-martin",
  "polynesie-francaise","wallis-et-futuna"
];

const BASE_PRODUCTS = [
  { name: "Lait demi-écrémé", price: 1.20, store: "HyperDom" },
  { name: "Baguette",         price: 0.90, store: "TiPrix"    },
  { name: "Yaourt nature",    price: 2.50, store: "Market Caraïbes" }
];

(async () => {
  try {
    for (const zone of ZONES) {
      console.log(`\n🌍 Zone: ${zone}`);
      for (let i = 0; i < BASE_PRODUCTS.length; i++) {
        const p = {
          ...BASE_PRODUCTS[i],
          id: `${zone}_prod${i + 1}`,
          zone,
          updatedAt: new Date()
        };
        await db.collection("products").doc(p.id).set(p, { merge: true });
        console.log(`✅ Produit ajouté : ${p.name} (${p.store}) -> ${zone}`);
      }
    }
    console.log("\n🎉 Données insérées avec succès pour toutes les zones DROM + COM !");
  } catch (e) {
    console.error("❌ Erreur :", e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
NODE
}

# --- Rank & Recompute ---
rank_all() {
  curl -sS "${BASE_URL}/getRanking" | jq . 2>/dev/null || curl -sS "${BASE_URL}/getRanking"
}
rank_zone() {
  read -r -p "Zone ? " Z
  curl -sS "${BASE_URL}/getRanking?zone=${Z}" | jq . 2>/dev/null || curl -sS "${BASE_URL}/getRanking?zone=${Z}"
}
recompute_all() {
  local KEY="${AKIPRI_SECRET:-}"
  if [ -z "${KEY}" ]; then read -r -p "Clé secrète ? " KEY; fi
  curl -sS "${BASE_URL}/recomputeNow?key=${KEY}" | jq . 2>/dev/null || curl -sS "${BASE_URL}/recomputeNow?key=${KEY}"
}
recompute_zone() {
  local KEY="${AKIPRI_SECRET:-}"
  if [ -z "${KEY}" ]; then read -r -p "Clé secrète ? " KEY; fi
  read -r -p "Zone ? " Z
  curl -sS "${BASE_URL}/recomputeNow?zone=${Z}&key=${KEY}" | jq . 2>/dev/null \
    || curl -sS "${BASE_URL}/recomputeNow?zone=${Z}&key=${KEY}"
}

# =========================
#  BACKUP / RESTORE
# =========================

# Génère (si besoin) les scripts Node d'export/import
ensure_backup_tools() {
  mkdir -p "${TOOLS_DIR}"

  # ---- tools/backup.js ----
  cat > "${TOOLS_DIR}/backup.js" <<'JS'
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const collections = ["products", "rankings"]; // ajoute d'autres collections si besoin
const outDir = process.argv[2] || path.join(process.cwd(), "..", "backups");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = path.join(outDir, `backup-${stamp}.json`);

(async () => {
  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const dump = {};
    for (const col of collections) {
      const snap = await db.collection(col).get();
      dump[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    fs.writeFileSync(outFile, JSON.stringify(dump, null, 2), "utf8");
    console.log("✅ Backup créé :", outFile);
  } catch (e) {
    console.error("❌ Backup échec :", e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
JS

  # ---- tools/restore.js ----
  cat > "${TOOLS_DIR}/restore.js" <<'JS'
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const file = process.argv[2];
if (!file) { console.error("Usage: node tools/restore.js <backup.json>"); process.exit(1); }
if (!fs.existsSync(file)) { console.error("Fichier introuvable:", file); process.exit(1); }

(async () => {
  try {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const [col, items] of Object.entries(json)) {
      console.log(`↩️  Restore ${col} (${items.length} docs)`);
      for (const it of items) {
        const { id, ...data } = it;
        await db.collection(col).doc(id).set(data, { merge: true });
      }
    }
    console.log("✅ Restore terminé.");
  } catch (e) {
    console.error("❌ Restore échec :", e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
JS
}

backup_now() {
  use_sa_if_exists
  if [ ! -f "${SA_FILE}" ]; then echo "❌ ${SA_FILE} manquant (option 2)."; return 1; fi
  ensure_deps
  ensure_backup_tools
  (cd "${FUN_DIR}" && node tools/backup.js "${BACKUP_DIR}")
}

restore_now() {
  use_sa_if_exists
  if [ ! -f "${SA_FILE}" ]; then echo "❌ ${SA_FILE} manquant (option 2)."; return 1; fi
  ensure_deps
  ensure_backup_tools
  echo "Fichier JSON à restaurer (dans ${BACKUP_DIR}) ?"
  ls -1 "${BACKUP_DIR}"/*.json 2>/dev/null || true
  read -r -p "> " FILE_IN
  if [[ ! -f "${FILE_IN}" ]]; then
    if [[ -f "${BACKUP_DIR}/${FILE_IN}" ]]; then FILE_IN="${BACKUP_DIR}/${FILE_IN}"; fi
  fi
  if [ ! -f "${FILE_IN}" ]; then echo "❌ Fichier introuvable."; return 1; fi
  (cd "${FUN_DIR}" && node tools/restore.js "${FILE_IN}")
}

list_backups() {
  echo "📁 Backups dans ${BACKUP_DIR}:"
  ls -lh "${BACKUP_DIR}"/*.json 2>/dev/null || echo "(aucun pour le moment)"
}

# =========================
#  MENU
# =========================

ensure_deps
use_sa_if_exists

while true; do
  echo
  echo "================= MENU ================="
  echo "1) 📦 Réinstaller dépendances"
  echo "2) 🔑 (Re)charger le serviceAccount.json"
  echo "3) 🌱 Lancer le seed Firestore"
  echo "4) 📊 Rank ALL (toutes zones)"
  echo "5) 🗂️ Rank par zone"
  echo "6) ♻️ Recompute ALL (clé secrète)"
  echo "7) 🔁 Recompute par zone (clé secrète)"
  echo "----------------------------------------"
  echo "8) 🧰 Définir/voir AKIPRI_SECRET"
  echo "9) 🚪 Quitter"
  echo "----------------------------------------"
  echo "10) 💾 Backup Firestore → ${BACKUP_DIR}"
  echo "11) ↩️  Restore Firestore depuis un backup"
  echo "12) 📂 Lister les backups"
  echo "========================================"
  read -r -p "Choix : " CH

  case "${CH}" in
    1) ensure_deps ;;
    2) reload_sa ;;
    3) seed_firestore ;;
    4) rank_all ;;
    5) rank_zone ;;
    6) recompute_all ;;
    7) recompute_zone ;;
    8)  echo "AKIPRI_SECRET actuel: ${AKIPRI_SECRET:-<non défini>}"
        read -r -p "Nouvelle valeur (laisser vide pour conserver): " NV
        if [ -n "${NV}" ]; then export AKIPRI_SECRET="${NV}"; echo "✅ OK"; fi ;;
    9) exit 0 ;;
    10) backup_now ;;
    11) restore_now ;;
    12) list_backups ;;
    *) echo "Choix invalide." ;;
  esac
done

###############################################################################
# 🔔 Planificateur — Sauvegarde Firestore quotidienne (Termux Job Scheduler)
# Ajoute 3 entrées de menu :
# 13) Activer sauvegarde auto quotidienne
# 14) Désactiver la sauvegarde auto
# 15) Voir l’état des tâches planifiées
###############################################################################

# --- Paramètres ---
JOB_ID_BACKUP=81013
TOOLS_DIR="$HOME/akiprisaye-web/tools"
BACKUPS_DIR="$HOME/akiprisaye-web/backups"
SERVICE_JSON="$HOME/akiprisaye-web/functions/serviceAccount.json"
INIT_SH="$HOME/akiprisaye-web/init.sh"
BACKUP_JOB="$TOOLS_DIR/backup_job.sh"

ensure_paths() {
  mkdir -p "$TOOLS_DIR" "$BACKUPS_DIR"
}

# Script appelé par le JobScheduler (il simule l’option 10 de ton menu puis 9 pour quitter)
create_backup_job_script() {
  ensure_paths
  cat > "$BACKUP_JOB" <<'EOS'
#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

ROOT="$HOME/akiprisaye-web"
LOG_DIR="$ROOT/backups"
LOG_FILE="$LOG_DIR/backup_$(date +%F_%H%M%S).log"

mkdir -p "$LOG_DIR"

# Variables utiles (si tu as besoin de la clé secrète pour d’autres actions)
export AKIPRI_SECRET="${AKIPRI_SECRET:-}"
export GOOGLE_APPLICATION_CREDENTIALS="$ROOT/functions/serviceAccount.json"

# Lance le menu en mode non interactif : 10 (Backup) puis 9 (Quitter)
# On log tout pour audit
{
  echo "=== $(date) : backup auto démarré ==="
  cd "$ROOT"
  printf '10\n9\n' | bash "$ROOT/init.sh"
  echo "=== $(date) : backup auto terminé ==="
} >>"$LOG_FILE" 2>&1
EOS
  chmod +x "$BACKUP_JOB"
}

# Active la tâche planifiée (toutes les 24h). Ajoute --persisted pour survivre aux redémarrages.
enable_backup_job() {
  if [ ! -f "$SERVICE_JSON" ]; then
    echo "❌ Clé de service introuvable : $SERVICE_JSON"
    echo "   Utilise d’abord l’option 2 du menu pour (re)charger la clé."
    return 1
  fi
  create_backup_job_script

  # Annule l’ancienne si elle existe, puis programme la nouvelle (toutes les 24h)
  termux-job-scheduler --cancel "$JOB_ID_BACKUP" >/dev/null 2>&1 || true
  termux-job-scheduler \
    --job-id "$JOB_ID_BACKUP" \
    --period-ms 86400000 \
    --persisted true \
    --battery-not-low true \
    --script "$BACKUP_JOB"

  if [ $? -eq 0 ]; then
    echo "✅ Sauvegarde auto ACTIVÉE (job $JOB_ID_BACKUP)."
    echo "   Elle s’exécutera ~toutes les 24h. Tu peux forcer un run : $BACKUP_JOB"
  else
    echo "❌ Échec de l’activation du job."
  fi
}

# Désactive la tâche
disable_backup_job() {
  termux-job-scheduler --cancel "$JOB_ID_BACKUP"
  if [ $? -eq 0 ]; then
    echo "🛑 Sauvegarde auto DÉSACTIVÉE (job $JOB_ID_BACKUP annulé)."
  else
    echo "ℹ️ Aucun job $JOB_ID_BACKUP à annuler (ou déjà désactivé)."
  fi
}

# Affiche l’état des tâches
status_backup_jobs() {
  echo "📋 Tâches planifiées (Termux) :"
  termux-job-scheduler --jobs
  echo
  echo "📂 Derniers logs de backup :"
  ls -1t "$BACKUPS_DIR"/*_log.txt 2>/dev/null | head -n 5 || echo "(aucun log encore)"
}

# === Intégration dans le menu principal ===
print_menu() {
  # Si ta fonction d’affichage de menu existe déjà, NE RIEN CHANGER ICI.
  # Sinon, ce bloc suppose que tu as un print_menu existant.
  :
}

# Injection des nouvelles actions dans le switch/case de lecture du choix.
# Si ton script a déjà un "while true; do ... read -r CHOIX ... case $CHOIX in ... esac",
# ajoute simplement ces 3 cases dans ce "case".
case "${CHOIX:-}" in
  13)
    echo "⏰ Activation de la sauvegarde automatique quotidienne…"
    enable_backup_job
    read -rp "↩︎ Entrée pour revenir au menu… " _ ; clear
    ;;
  14)
    echo "⏸️ Désactivation de la sauvegarde automatique…"
    disable_backup_job
    read -rp "↩︎ Entrée pour revenir au menu… " _ ; clear
    ;;
  15)
    echo "🔎 État des tâches et derniers logs…"
    status_backup_jobs
    read -rp "↩︎ Entrée pour revenir au menu… " _ ; clear
    ;;
esac

# Ajoute ces 3 lignes à l’affichage de ton menu (là où tu listes déjà 1..12) :
# 13) ⏰ Activer sauvegarde auto quotidienne
# 14) ⏸️  Désactiver sauvegarde auto
# 15) 🔎  État des tâches / derniers logs
###############################################################################

