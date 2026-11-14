
export function toPaisa(value: string | number): bigint {
  const text = String(value);

  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text)) {
    throw new Error("Invalid monetary value.");
  }

  const [whole, fraction = ""] = text.split(".");

  return (
    BigInt(whole) * BigInt("100") +
    BigInt((fraction + "00").slice(0, 2))
  );
}

export function fromPaisa(value: bigint): string {
  const zero = BigInt("0");
  const hundred = BigInt("100");
  const negative = value < zero;
  const absolute = negative ? -value : value;

  const whole = absolute / hundred;
  const fraction = String(absolute % hundred).padStart(2, "0");

  return `${negative ? "-" : ""}${whole}.${fraction}`;
}
