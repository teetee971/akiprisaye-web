export function detectSymbols(text) {
  const symbols = [];
  if (/recycl|tri/i.test(text)) symbols.push('♻️ Recyclable');
  if (/pao|12m|24m/i.test(text)) symbols.push('📦 PAO détecté');
  return symbols;
}
