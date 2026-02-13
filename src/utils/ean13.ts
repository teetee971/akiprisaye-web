export function isValidEAN13(input: string): boolean {
  const code = (input ?? '').replace(/\D/g, '');
  if (code.length !== 13) {
    return false;
  }

  const digits = code.split('').map((char) => Number(char));
  if (digits.some((digit) => Number.isNaN(digit))) {
    return false;
  }

  const checkDigit = digits[12];

  let sum = 0;
  for (let index = 0; index < 12; index += 1) {
    sum += digits[index] * (index % 2 === 0 ? 1 : 3);
  }

  const computed = (10 - (sum % 10)) % 10;
  return computed === checkDigit;
}
