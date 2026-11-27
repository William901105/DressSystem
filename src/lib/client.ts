export class RequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export async function send<T>(path: string, method: string, data: object): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && path !== "/api/access") window.location.assign("/access");
    throw new RequestError(response.status, result?.error ?? "操作暫時無法完成，請稍後重試。");
  }
  return result as T;
}

export function errorMessage(error: unknown) {
  if (error instanceof RequestError) return error.message;
  return "暫時無法連線，請檢查網路後重試。";
}
