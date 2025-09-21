import React, { useState, useEffect } from 'react';

// Service Worker utilities
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Mock VAPID key for demo (in production, use your own)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80xeSCeVHdJK6P5K1d0K8fZv2L1s9bA-K1FcPEhB3w2BPJ1j9VW9E5I8';

export default function NotificationSystem() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [priceThreshold, setPriceThreshold] = useState(10); // % increase threshold

  useEffect(() => {
    // Check for service worker and notification support
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      
      // Get existing subscription
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setSubscription(subscription);
        });
      });
    }

    // Load saved alerts from localStorage
    const savedAlerts = localStorage.getItem('akp_price_alerts');
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts));
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      alert('Les notifications push ne sont pas supportées sur ce navigateur');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribeToPush();
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      setSubscription(subscription);
      
      // In production, send subscription to your server
      console.log('Subscription créé:', subscription);
      
      // Show demo notification
      showDemoNotification();
      
    } catch (error) {
      console.error('Erreur lors de l\'abonnement:', error);
    }
  };

  const showDemoNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('A KI PRI SA YÉ', {
        body: 'Notifications activées ! Vous serez alerté des variations de prix importantes.',
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'demo-notification'
      });
    }
  };

  const addPriceAlert = (productName, currentPrice, territory) => {
    const newAlert = {
      id: Date.now(),
      productName,
      currentPrice,
      territory,
      threshold: priceThreshold,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    const updatedAlerts = [...alerts, newAlert];
    setAlerts(updatedAlerts);
    localStorage.setItem('akp_price_alerts', JSON.stringify(updatedAlerts));
    
    // Show confirmation notification
    if (Notification.permission === 'granted') {
      new Notification('Alerte Prix Créée', {
        body: `Vous serez notifié si le prix de "${productName}" augmente de plus de ${priceThreshold}%`,
        icon: '/icon.svg',
        tag: 'alert-created'
      });
    }
  };

  const removeAlert = (alertId) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    setAlerts(updatedAlerts);
    localStorage.setItem('akp_price_alerts', JSON.stringify(updatedAlerts));
  };

  const toggleAlert = (alertId) => {
    const updatedAlerts = alerts.map(alert => 
      alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
    );
    setAlerts(updatedAlerts);
    localStorage.setItem('akp_price_alerts', JSON.stringify(updatedAlerts));
  };

  // Mock function to simulate price changes and trigger notifications
  const simulatePriceAlert = () => {
    if (Notification.permission === 'granted') {
      new Notification('🚨 Alerte Prix!', {
        body: 'Le prix du Lait UHT 1L a augmenté de 15% en Guadeloupe (+0.22€)',
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'price-alert',
        data: {
          product: 'Lait UHT 1L',
          territory: 'Guadeloupe',
          priceChange: '+15%'
        },
        actions: [
          {
            action: 'view',
            title: 'Voir détails'
          },
          {
            action: 'find-alternative',
            title: 'Trouver moins cher'
          }
        ]
      });
    }
  };

  const simulatePromotionAlert = () => {
    if (Notification.permission === 'granted') {
      new Notification('🎉 Bonne affaire détectée!', {
        body: 'Promotion de -30% sur les pâtes chez TiPrix Martinique',
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'promotion-alert',
        data: {
          product: 'Pâtes 500g',
          store: 'TiPrix',
          territory: 'Martinique',
          discount: '-30%'
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          🔔
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Notifications Intelligentes</h2>
          <p className="text-sm text-gray-600">Restez informé des variations de prix</p>
        </div>
      </div>

      {/* Permission Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium">Statut des notifications</div>
            <div className="text-sm text-gray-600">
              {permission === 'granted' && '✅ Activées'}
              {permission === 'denied' && '❌ Refusées'}
              {permission === 'default' && '⏳ En attente de permission'}
            </div>
          </div>
          
          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              disabled={!isSupported}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSupported ? 'Activer' : 'Non supporté'}
            </button>
          )}
          
          {permission === 'granted' && !subscription && (
            <button
              onClick={subscribeToPush}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              S'abonner aux push
            </button>
          )}
          
          {subscription && (
            <div className="text-green-600 font-medium">✅ Abonné</div>
          )}
        </div>
      </div>

      {/* Alert Settings */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Paramètres d'alerte</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seuil d'alerte (% d'augmentation)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="50"
                value={priceThreshold}
                onChange={(e) => setPriceThreshold(e.target.value)}
                className="flex-1"
              />
              <span className="text-sm font-medium w-12">{priceThreshold}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Être alerté quand le prix augmente de plus de {priceThreshold}%
            </p>
          </div>
        </div>
      </div>

      {/* Demo Buttons */}
      {permission === 'granted' && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Tester les notifications</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={simulatePriceAlert}
              className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
            >
              🚨 Simuler alerte prix
            </button>
            <button
              onClick={simulatePromotionAlert}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm"
            >
              🎉 Simuler promotion
            </button>
            <button
              onClick={() => addPriceAlert('Lait UHT 1L', 1.45, 'Guadeloupe')}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
            >
              ➕ Ajouter alerte test
            </button>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      <div>
        <h3 className="font-semibold mb-3">Alertes actives ({alerts.filter(a => a.isActive).length})</h3>
        
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔕</div>
            <p>Aucune alerte configurée</p>
            <p className="text-sm">Créez une alerte pour être notifié des variations de prix</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{alert.productName}</div>
                  <div className="text-sm text-gray-600">
                    {alert.territory} • Prix actuel: {alert.currentPrice}€ • Seuil: +{alert.threshold}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Créé le {new Date(alert.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAlert(alert.id)}
                    className={`px-2 py-1 rounded text-xs ${
                      alert.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {alert.isActive ? 'Actif' : 'Inactif'}
                  </button>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Comment ça marche ?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Les notifications vous alertent des hausses de prix importantes</li>
          <li>• Recevez des alertes de promotions dans votre territoire</li>
          <li>• Configurez vos seuils d'alerte personnalisés</li>
          <li>• Fonctionne même quand l'application est fermée</li>
        </ul>
      </div>
    </div>
  );
}