# 🌍 A KI PRI SA YÉ — API

API Cloudflare Pages Functions pour la comparaison de prix et la gestion des territoires DOM-TOM.

---

## 📌 Endpoints disponibles

### 1. `/api/territories`

Retourne la liste des territoires supportés par l’API.

#### Exemple d’appel
```bash
curl -s "https://akiprisaye.pages.dev/api/territories" | jq .
curl -s "https://akiprisaye.pages.dev/api/prices?territory=guadeloupe&limit=3" | jq .
./test_api.sh
import { useEffect, useState } from "react";

export default function Prices() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("https://akiprisaye.pages.dev/api/prices?territory=guadeloupe&limit=5")
      .then(res => res.json())
      .then(json => setData(json.data || []));
  }, []);

  return (
    <div>
      <h2>Articles en Guadeloupe</h2>
      <ul>
        {data.map(item => (
          <li key={item.id}>
            {item.title} — {item.price} {item.currency}
          </li>
        ))}
      </ul>
    </div>
  );
}
---

### Ensuite :
1. Vérifie le contenu :
   ```bash
   cat README.md
git add README.md
git commit -m "Ajout README avec doc API et exemple React"
git push
nano README.md
