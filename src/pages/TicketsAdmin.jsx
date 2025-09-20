import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase"; // ton init Firebase
import Papa from "papaparse";

export default function TicketsAdmin() {
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      const querySnapshot = await getDocs(collection(db, "tickets"));
      const data = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTickets(data);
      setFiltered(data);
    };
    fetchTickets();
  }, []);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "tickets", id));
    setTickets((prev) => prev.filter((t) => t.id !== id));
    setFiltered((prev) => prev.filter((t) => t.id !== id));
  };

  const handleEdit = async (id, field, value) => {
    await updateDoc(doc(db, "tickets", id), { [field]: value });
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
    setFiltered((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleSearch = (q) => {
    setSearch(q);
    if (!q) return setFiltered(tickets);
    setFiltered(
      tickets.filter(
        (t) =>
          t.enseigne?.toLowerCase().includes(q.toLowerCase()) ||
          t.date?.includes(q)
      )
    );
  };

  const exportCSV = () => {
    const csv = Papa.unparse(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "tickets.csv");
    link.click();
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">📂 Gestion des Tickets</h1>

      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="p-2 rounded bg-gray-800 border border-gray-700 flex-1"
          placeholder="Rechercher par enseigne ou date..."
        />
        <button
          onClick={exportCSV}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          Export CSV
        </button>
      </div>

      <table className="w-full border border-gray-700 rounded">
        <thead>
          <tr className="bg-gray-800 text-left">
            <th className="p-2">Enseigne</th>
            <th className="p-2">SIRET</th>
            <th className="p-2">Date</th>
            <th className="p-2">Total (€)</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((t) => (
            <tr key={t.id} className="border-t border-gray-700">
              <td className="p-2">
                <input
                  defaultValue={t.enseigne}
                  onBlur={(e) => handleEdit(t.id, "enseigne", e.target.value)}
                  className="bg-transparent border-b border-gray-600 focus:outline-none"
                />
              </td>
              <td className="p-2">{t.siret}</td>
              <td className="p-2">{t.date}</td>
              <td className="p-2">{t.total}</td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => handleDelete(t.id)}
                  className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}