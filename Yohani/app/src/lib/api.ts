export async function api<T>(path: string, body?: unknown, token = ""): Promise<T> {
  const headers = new Headers();
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("X-App-Token", token);
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || data.status === "error") {
    throw new Error(data.message || "No se pudo completar");
  }
  return data as T;
}

export function money(value: number): string {
  const amount = Number(value) || 0;
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function sms(phone: string, body: string): void {
  const digits = phone.replace(/\D/g, "");
  const to = digits.length === 10 ? `1${digits}` : digits;
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const href = ios
    ? `sms:+${to}&body=${encodeURIComponent(body)}`
    : `sms:+${to}?body=${encodeURIComponent(body)}`;
  window.location.href = href;
}

export function readPhoto(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error("foto"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("foto"));
    reader.readAsDataURL(file);
  });
}
