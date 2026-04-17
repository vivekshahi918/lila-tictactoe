import { Client } from "@heroiclabs/nakama-js";

// Use 127.0.0.1 (IPv4) explicitly
const client = new Client("defaultkey", "127.0.0.1", "7350", false);

export { client };

export async function authenticate() {
    if (typeof window === "undefined") return;

    let deviceId = localStorage.getItem("nakama_device_id");
    if (!deviceId) {
        deviceId = "dev_" + Math.random().toString(36).substring(7);
        localStorage.setItem("nakama_device_id", deviceId);
    }

    try {
        const session = await client.authenticateDevice(deviceId, true);
        return session;
    } catch (e) {
        console.error("Auth Failed:", e);
        throw e;
    }
}