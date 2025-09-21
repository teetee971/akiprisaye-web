import { db } from '../lib/firebase'
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore'

// Local cart in localStorage
const CART_KEY = 'akipri.cart'
const readCart = ()=> JSON.parse(localStorage.getItem(CART_KEY) || '[]')
const writeCart = (v)=> localStorage.setItem(CART_KEY, JSON.stringify(v))

export function cartItems(){ return readCart() }
export function addToCart(item){ const c = readCart(); c.push(item); writeCart(c) }
export function clearCart(){ writeCart([]) }
export function cartTotal(){ return readCart().reduce((s,i)=> s + (i.price||0), 0) }

export async function seedFirestore(){
  // fetch public seed
  const res = await fetch('/seed.products.json')
  const json = await res.json()
  const col = collection(db, 'products')
  for(const p of json.products){
    await setDoc(doc(col, p.id), p, { merge: true })
  }
  return true
}

export async function searchProducts(qtext){
  const col = collection(db, 'products')
  let res = []
  if(!qtext || qtext.trim()===''){
    const snap = await getDocs(col)
    res = snap.docs.map(d=> d.data())
  } else {
    // simple naive contains filter client-side
    const snap = await getDocs(col)
    const all = snap.docs.map(d=> d.data())
    res = all.filter(p=> (p.name||'').toLowerCase().includes(qtext.toLowerCase()))
  }
  return res.map(p => ({...p, best: p.prices.reduce((a,b)=> a.price<b.price?a:b)}))
}

export async function cheapestForQuery(qtext){
  const items = await searchProducts(qtext)
  if(items.length===0) return "Aucune correspondance trouvée."
  const best = items.sort((a,b)=> a.best.price - b.best.price)[0]
  return `Le meilleur prix pour "${qtext}" semble être ${best.best.price.toFixed(2)}€ chez ${best.best.store} (article: ${best.name}).`
}

export async function basketForBudget(budget){
  const snap = await getDocs(collection(db,'products'))
  const all = snap.docs.map(d=> d.data())
  // simple greedy by cheapest first
  const flat = all.map(p => ({id:p.id, name:p.name, ...p.prices.sort((a,b)=>a.price-b.price)[0]})).sort((a,b)=> a.price-b.price)
  let sum=0, choose=[]
  for(const it of flat){
    if(sum + it.price <= budget){
      choose.push(it); sum += it.price
    } else break
  }
  if(choose.length===0) return `Budget trop faible pour un panier (min env. ${flat[0].price.toFixed(2)}€).`
  const lines = choose.map(i=> `- ${i.name} — ${i.price.toFixed(2)}€ (${i.store})`).join('\n')
  return `Panier proposé (~${sum.toFixed(2)}€ / budget ${budget.toFixed(2)}€):\n${lines}`
}

export async function saveTicketLines(lines){
  // very naive store as a doc with timestamp; parsing can be improved later
  const id = String(Date.now())
  await setDoc(doc(collection(db,'tickets'), id), { id, lines, at: new Date().toISOString() })
}