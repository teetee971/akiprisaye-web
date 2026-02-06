TI-PANIER (v1) — Usage
======================

Purpose
-------
Ti-panier is a lightweight hook for managing a shopping cart ("panier") in a React application. It provides a simple API to add, remove, update items and persist the cart to local storage with a versioned key to allow migrations across versions.

Storage key
-----------
The hook persists data to localStorage under a versioned key:

- localStorage key: `ti-panier:v1`

Versioning the key allows safe storage schema changes in future releases and supports migration strategies.

Basic API (example)
-------------------
The hook exposes an ergonomic API. Example TypeScript signatures (illustrative):

- const { cart, addItem, removeItem, updateItem, clearCart, totalCount, totalPrice } = useTiPanier();
- cart: CartItem[]
- addItem(item: CartItem, quantity?: number): void
- removeItem(itemId: string): void
- updateItem(itemId: string, updates: Partial<CartItem> & { quantity?: number }): void
- clearCart(): void
- totalCount: number
- totalPrice: number

Example usage (React + TypeScript)
---------------------------------
import React from 'react';
import { useTiPanier } from './useTiPanier';

function ProductRow({ product }) {
  const { addItem } = useTiPanier();

  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.price} €</p>
      <button onClick={() => addItem({ id: product.id, name: product.name, price: product.price }, 1)}>
        Add to cart
      </button>
    </div>
  );
}

function Cart() {
  const { cart, removeItem, updateItem, clearCart, totalCount, totalPrice } = useTiPanier();

  return (
    <aside aria-label="Shopping cart">
      <div role="status" aria-live="polite">
        {totalCount} item(s)
      </div>

      <ul>
        {cart.map(i => (
          <li key={i.id}>
            <div>{i.name}</div>
            <div>{i.price} € × {i.quantity}</div>
            <button onClick={() => updateItem(i.id, { quantity: Math.max(1, i.quantity - 1) })}>−</button>
            <button onClick={() => updateItem(i.id, { quantity: i.quantity + 1 })}>+</button>
            <button onClick={() => removeItem(i.id)}>Remove</button>
          </li>
        ))}
      </ul>

      <div>Total: {totalPrice} €</div>
      <button onClick={clearCart}>Clear</button>
    </aside>
  );
}

Recommendations and best practices
---------------------------------
- Storage & security:
  - Do not store sensitive data (payment details, PII) in localStorage.
  - Keep the persisted item payload minimal (id, name, price, quantity, metadata id) and fetch sensitive details from server when needed.
- Versioning & migration:
  - Use the versioned key (`ti-panier:v1`). On breaking schema changes, create a migration that reads the previous key, transforms the data, and writes to the new key.
- Server-sync:
  - For logged-in users, periodically sync client cart to server (merge server and client carts on sign-in).
  - Implement conflict resolution (e.g., prefer server quantities or sum quantities) and surface merge results to the user.
- Performance:
  - Debounce writes to localStorage when many rapid updates happen (e.g., quantity spinners).
  - Keep serialized payload sizes small to prevent performance issues.
- Type safety:
  - Provide TypeScript types for CartItem and hook API.
- Testing:
  - Test both UI behavior and storage persistence. See tests section for examples.

Accessibility
-------------
- Announce cart changes:
  - Use an aria-live polite region to announce totals or important cart state changes (item added, removed, cart cleared).
  - Example: <div role="status" aria-live="polite">...
- Keyboard and focus management:
  - Ensure interactive controls (add/remove, increment/decrement) are keyboard accessible and have visible focus styles.
  - When opening a cart panel, move focus to the cart container and restore focus to the triggering control when closing.
- Screen readers:
  - Provide descriptive labels for cart controls and form fields.
  - Use semantic elements (button, list, heading) and ARIA only when necessary.
- Contrast and size:
  - Ensure controls meet color contrast and touch target size guidelines.

Testing examples
----------------
Unit / hook tests (React Testing Library + jest)
- Persisting data:
  - Ensure adding an item writes the expected JSON to localStorage key `ti-panier:v1`.
- API behavior:
  - addItem:
    - Should add a new item or increment quantity if item exists.
  - removeItem:
    - Should remove item from cart.
  - updateItem:
    - Should update quantity and other properties.
  - clearCart:
    - Should empty both memory and localStorage.
- Edge cases:
  - Adding an item with zero/negative quantity should be handled (clamped or rejected).
  - Test migration flow: if an older storage key exists, migration function transforms data correctly.

Integration / e2e tests
- Simulate a user adding items, reloading the page, and asserting cart contents persist.
- Test sign-in merge flow to ensure server and client carts merge as expected.

Migration guidance
------------------
- When releasing v2 that changes the schema:
  - Read v1 data from `ti-panier:v1`.
  - Transform items to the new format.
  - Write transformed data to `ti-panier:v2`.
  - Optionally keep a small compatibility shim that recognizes both keys for a transition period.

Notes
-----
- The examples in this document are illustrative — adapt the exact API surface to match your implementation.
- Keep the storage key stable for minor, backward-compatible changes; bump the version when you change the persisted shape.
