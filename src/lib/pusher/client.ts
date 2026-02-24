"use client";

import PusherClient from "pusher-js";
import { getActiveSessionToken } from "@/lib/session";

let pusherInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherInstance) {
    pusherInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        channelAuthorization: {
          endpoint: "/api/pusher/auth",
          transport: "ajax",
          headersProvider: () => {
            const token = getActiveSessionToken();
            return token ? { "X-Session-Token": token } : {};
          },
        },
      }
    );
  }
  return pusherInstance;
}
