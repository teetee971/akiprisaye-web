export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function stableCashierHash(label: string, salt: string): Promise<string> {
  return sha256Hex(`cashier:${label}::${salt}`);
}
