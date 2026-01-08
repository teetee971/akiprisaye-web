import React, { useState } from 'react';
import { requestGeolocation } from '../utils/geolocation';

export function LocationButton() {
  const [status, setStatus] = useState<string>('Statut géolocalisation : refusée ou indisponible');

  const showMessage = (m: string, _severity?: string) => {
    setStatus(m);
    // Optionnel : afficher aussi un toast/snackbar global
  };

  const onActivate = async () => {
    setStatus('Demande de position en cours...');
    const pos = await requestGeolocation(showMessage);
    if (pos) {
      setStatus('Position obtenue');
      // utiliser pos.coords.latitude / longitude ici
    }
  };

  return (
    <div>
      <p className="small-text">{status}</p>
      <button onClick={onActivate} className="primary">Activer ma position</button>
    </div>
  );
}

export default LocationButton;