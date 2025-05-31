// src/utils/ipUtils.ts
export async function getUserIP(): Promise<string | null> {
    try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        return data.ip as string;
    } catch {
        return null;
    }
}
