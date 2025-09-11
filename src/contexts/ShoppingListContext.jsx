import React, { createContext, useContext, useEffect, useState } from "react";

const ShoppingListContext = createContext();

export function ShoppingListProvider({ children }) {
  const [list, setList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shopping:list")) || [];
    } catch { return []; }
  });
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    try { localStorage.setItem("shopping:list", JSON.stringify(list)); } catch {}
  }, [list]);

  function addItem(e) {
    e.preventDefault();
    const name = title.trim();
    const val  = parseFloat(String(price).replace(",", "."));
    if (!name) return;
    setList(cur => [{ id: Date.now(), title: name, price: isNaN(val) ? 0 : val }, ...cur]);
    setTitle(""); setPrice("");
  }

  function removeItem(id)   { setList(cur => cur.filter(it => it.id !== id)); }
  function clearList()      { setList([]); }

  const total = list.reduce((sum, it) => sum + (it.price || 0), 0);

  return (
    <ShoppingListContext.Provider value={{
      list, title, setTitle, price, setPrice, addItem, removeItem, clearList, total
    }}>
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  return useContext(ShoppingListContext);
}
