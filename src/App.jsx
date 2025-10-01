import React, { useEffect, useState } from 'react';

function App() {
  const [products, setProducts] = useState([]);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    fetch('/data/alimentaire.json')
      .then(res => res.json())
      .then(data => setProducts(data));

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  return (
    <div className="min-h-screen p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold">🌍 A KI PRI SA YÉ</h1>
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-800"
          >
            Installer l’app
          </button>
        )}
      </header>
      <main>
        <h2 className="text-2xl mb-4">Produits alimentaires</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((item, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-md">
              <img src={item.image} alt={item.nom} className="w-full h-40 object-cover rounded" />
              <h3 className="text-lg font-semibold mt-2">{item.nom}</h3>
              <p className="text-sm text-gray-300">{item.prix} €</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
