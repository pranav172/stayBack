"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useOnlineCount() {
  const [count, setCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel("online-users");

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const totalOnline = Object.keys(state).length;
        // Add a base number to make it look populated for MVP launch if needed (e.g. + user base)
        // For now, raw count.
        setCount(totalOnline);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const response = await channel.track({
            online_at: new Date().toISOString(),
          });
          if (response !== "ok") {
            console.error("Presence track error:", response);
          }
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);

  return count;
}
