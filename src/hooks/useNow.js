import { useState, useEffect } from "react";

/* Single shared 1 s ticker — created once in LineMonitor and passed down so
   51 machine nodes don't each run their own interval. */
export function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
