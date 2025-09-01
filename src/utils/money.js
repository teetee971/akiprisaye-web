export const euro = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

export const pct = (n, digits = 1) =>
  `${Number(n).toFixed(digits).replace('.', ',')} %`;
