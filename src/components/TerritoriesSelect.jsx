import { useEffect, useState } from "react";

export default function TerritoriesSelect() {
  const [territories, setTerritories] = useState([]);

  useEffect(() => {
    fetch("https://akiprisaye.pages.dev/api/territories")
      .then(res => res.json())
      .then(json => setTerritories(json.territories || []));
  }, []);

  return (
    <div>
      <label htmlFor="territory">Choisir un territoire :</label>
      <select id="territory" name="territory">
        {territories.map(t => (
          <option key={t.code} value={t.code}>
            {t.name} ({t.type})
          </option>
        ))}
      </select>
    </div>
  );
}
