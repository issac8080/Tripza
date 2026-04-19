/** Keep digits only for tel: / wa.me (India numbers often include +91). */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function telHref(phone: string): string {
  return `tel:${phoneDigits(phone)}`;
}

export function whatsappHref(phone: string, prefilledMessage?: string): string {
  const n = phoneDigits(phone);
  if (!n) {
    return "#";
  }
  const base = `https://wa.me/${n}`;
  if (!prefilledMessage?.trim()) {
    return base;
  }
  return `${base}?text=${encodeURIComponent(prefilledMessage.trim())}`;
}
