export default function TicketsAdmin() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Administration des Tickets
      </h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Gestion des tickets</h2>
        <p className="text-slate-600 mb-6">
          Interface d'administration pour la gestion des tickets de caisse.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">Tickets en attente</h3>
            <p className="text-2xl font-bold text-blue-600">0</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-900 mb-2">Tickets traités</h3>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-medium text-yellow-900 mb-2">Total aujourd'hui</h3>
            <p className="text-2xl font-bold text-yellow-600">0</p>
          </div>
        </div>
        
        <div className="mt-6">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Nouveau ticket
          </button>
        </div>
      </div>
    </div>
  );
}