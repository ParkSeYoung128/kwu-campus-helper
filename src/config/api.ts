// 백엔드(FastAPI) 주소
//   localhost가 아니라 '내 PC의 LAN IP'를 넣어야 됨!!!! 
//  와이파이 ipv4 주소 찾아서 넣기 ㄱㄱ
//   예) http://192.168.0.12:8000

//export const API_BASE_URL = 'http://YOUR_PC_LAN_IP:8000';
export const API_BASE_URL = 'http://192.168.35.199:8000';


export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}
