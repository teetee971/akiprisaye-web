export interface ExtractedCashierLabel {
  label: string | null;
  operatorId: string | null;
}

export function extractCashierLabel(text: string): ExtractedCashierLabel {
  const clean = text.replace(/\r/g, '\n');

  const explicitMatch = clean.match(/(?:CAISSI(?:ER|ERE)|H[ÔO]TE(?:SSE)?)[\s:]*([A-Z][A-Z' -]{2,}(?:\s*\(\d+\))?)/);
  if (explicitMatch?.[1]) {
    const label = explicitMatch[1].trim();
    const operatorId = label.match(/\((\d+)\)/)?.[1] ?? null;
    return { label, operatorId };
  }

  const anchorIndex = clean.search(/Ticket\s*n|Caisse/i);
  const ticketWindow = anchorIndex >= 0 ? clean.slice(anchorIndex, anchorIndex + 250) : clean.slice(0, 400);
  const isolatedMatch = ticketWindow.match(/\n\s*([A-Z][A-Z' -]{2,})(?:\s*\((\d{1,4})\))\s*\n/);
  if (isolatedMatch?.[1]) {
    return {
      label: `${isolatedMatch[1].trim()}${isolatedMatch[2] ? ` (${isolatedMatch[2]})` : ''}`,
      operatorId: isolatedMatch[2] ?? null,
    };
  }

  return { label: null, operatorId: null };
}
