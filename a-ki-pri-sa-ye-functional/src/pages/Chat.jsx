import { useState } from 'react'
import { cheapestForQuery, basketForBudget } from '../services/logic.js'

export default function Chat(){
  const [messages, setMessages] = useState([{role:'assistant', content:'Mwen la. Kisa ou bezwen? (ex: "riz", "panier 20€")'}])
  const [input, setInput] = useState('')

  const send = async () => {
    if(!input.trim()) return
    const userMsg = {role:'user', content: input}
    let reply = "M pa konprann. Egzanp: 'riz' oswa 'panier 20€'."
    const budgetMatch = input.toLowerCase().match(/panier\s*(\d+)[€e]?/)
    if(budgetMatch){
      const b = parseFloat(budgetMatch[1])
      const res = await basketForBudget(b)
      reply = res
    } else {
      const res = await cheapestForQuery(input)
      reply = res
    }
    setMessages(prev => [...prev, userMsg, {role:'assistant', content: reply}])
    setInput('')
  }

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-semibold">Chat IA Local (règle métier)</h2>
      <div className="mt-4 space-y-2 h-72 overflow-auto">
        {messages.map((m,i)=>(
          <div key={i} className={m.role==='assistant'?'text-white':'text-brand-500'}>{m.role==='assistant'?'🤖':'🧑'} {m.content}</div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input className="card px-3 py-2 flex-1" value={input} onChange={e=>setInput(e.target.value)} placeholder='Ex: riz | panier 30€' />
        <button onClick={send} className="link-btn">Envoyer</button>
      </div>
    </div>
  )
}