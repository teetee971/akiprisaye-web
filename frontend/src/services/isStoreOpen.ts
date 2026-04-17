type Hours = {
  open: string;
  close: string;
};

type SpecialHours = {
  date: string;
  open: string;
  close: string;
};

export function isStoreOpen(hours: Hours[], currentTime: string, specialHours?: SpecialHours) {
  const parse = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const now = parse(currentTime);

  let openTime: number;
  let closeTime: number;

  // priorité aux horaires spéciaux
  if (specialHours) {
    openTime = parse(specialHours.open);
    closeTime = parse(specialHours.close);
  } else {
    openTime = parse(hours[0].open);
    closeTime = parse(hours[0].close);
  }

  // fermé
  if (now >= closeTime) {
    return {
      status: 'closed',
      nextChangeMessage: `Réouvre à ${hours[0].open}`,
    };
  }

  // ouvert
  if (now >= openTime) {
    const diff = closeTime - now;

    if (diff <= 60) {
      return {
        status: 'closing_soon',
        nextChangeMessage: `Ferme à ${hours[0].close}`,
      };
    }

    return {
      status: 'open',
      nextChangeMessage: `Ferme à ${hours[0].close}`,
    };
  }

  // pas encore ouvert
  return {
    status: 'closed',
    nextChangeMessage: `Ouvre à ${hours[0].open}`,
  };
}
