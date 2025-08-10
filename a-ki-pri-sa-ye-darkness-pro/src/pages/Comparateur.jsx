export default function Comparateur(){
  return (
    <div className="card p-6">
      <h2 className="text-2xl font-semibold">Comparer les prix / Panier malin</h2>
      <p className="text-white/70 mt-2">Stub comparateur : liste des produits, filtres, panier, et résultats. Branchez votre Firestore/Backend ici.</p>
      <div className="mt-4 grid gap-3">
        <input placeholder="Rechercher un produit" className="card px-3 py-2 w-full" />
        <button className="link-btn w-full sm:w-auto">Rechercher</button>
      </div>
    </div>
  )
}
