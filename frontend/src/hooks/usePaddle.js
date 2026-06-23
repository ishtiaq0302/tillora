import { useState, useEffect, useRef } from "react";

const PADDLE_SCRIPT = "https://cdn.paddle.com/paddle/v2/paddle.js";

// Module-level guard so we only call Initialize once across React re-mounts.
let _initialized = false;

// When VITE_PADDLE_MOCK=true the hook skips Paddle.js entirely and simulates
// a successful transaction. Use this in local dev when you don't have a real
// Paddle sandbox Price ID configured.
const IS_MOCK = import.meta.env.VITE_PADDLE_MOCK === "true";

export function usePaddle({ onSuccess, onError, onClosed } = {}) {
  const [ready, setReady] = useState(_initialized || IS_MOCK);
  const cb = useRef({ onSuccess, onError, onClosed });

  // Keep callbacks fresh without re-running the effect.
  useEffect(() => {
    cb.current = { onSuccess, onError, onClosed };
  });

  useEffect(() => {
    if (IS_MOCK || _initialized) {
      setReady(true);
      return;
    }

    function init() {
      const isSandbox = import.meta.env.VITE_PADDLE_SANDBOX === "true";
      const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;

      if (!token || token === "your_sandbox_client_token") {
        console.error("[Paddle] VITE_PADDLE_CLIENT_TOKEN is not set in frontend/.env");
        return;
      }

      // Must be called BEFORE Initialize when using sandbox.
      if (isSandbox) {
        window.Paddle.Environment.set("sandbox");
      }

      window.Paddle.Initialize({
        token,
        eventCallback(event) {
          switch (event.name) {
            case "checkout.completed":
              cb.current.onSuccess?.(event.data);
              break;

            case "checkout.error":
              // Log the full event — event.data is sometimes undefined for 400 errors
              console.error("[Paddle] checkout.error full event:", JSON.stringify(event));
              cb.current.onError?.(event.data ?? null);
              break;

            case "checkout.closed":
              cb.current.onClosed?.();
              break;

            case "checkout.warning":
              console.warn("[Paddle] checkout.warning:", event.data);
              break;

            default:
              break;
          }
        },
      });

      _initialized = true;
      setReady(true);
    }

    let script = document.querySelector(`script[src="${PADDLE_SCRIPT}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = PADDLE_SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }

    if (window.Paddle) {
      init();
    } else {
      script.addEventListener("load", init);
    }

    return () => script.removeEventListener("load", init);
  }, []);

  function openCheckout({ priceId, email, customData } = {}) {
    // ── Simulation mode (VITE_PADDLE_MOCK=true) ────────────────────────────────
    // Fires onSuccess with a fake SIMULATED_ transaction ID after a brief delay.
    // The backend skips Paddle API verification for these IDs in non-production.
    if (IS_MOCK) {
      const simulatedTxId = `SIMULATED_${Date.now()}`;
      console.info("[Paddle] Mock mode — simulating successful checkout:", simulatedTxId);
      setTimeout(() => {
        cb.current.onSuccess?.({ transaction: { id: simulatedTxId }, _simulated: true });
      }, 900);
      return true;
    }

    if (!window.Paddle?.Checkout) {
      console.error("[Paddle] Paddle.js not ready. Call openCheckout after ready=true.");
      return false;
    }

    if (!priceId || !priceId.startsWith("pri_")) {
      console.error("[Paddle] Invalid priceId:", priceId, "— must start with 'pri_'");
      return false;
    }

    try {
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        ...(email ? { customer: { email } } : {}),
        ...(customData ? { customData } : {}),
      });
      return true;
    } catch (err) {
      console.error("[Paddle] Checkout.open threw:", err);
      return false;
    }
  }

  return { ready, openCheckout };
}
