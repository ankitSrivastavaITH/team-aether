export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8200";

export async function fetchAPI<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function postAPI<T>(path: string, body: FormData | Record<string, unknown>): Promise<T> {
  const isFormData = body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
    body: isFormData ? body : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
