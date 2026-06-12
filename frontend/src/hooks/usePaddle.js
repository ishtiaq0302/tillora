import { useState, useEffect, useRef } from "react";

const PADDLE_SCRIPT = "https://cdn.paddle.com/paddle/v2/paddle.js";

// Module-level guard so we only call Initialize once across React re-mounts.
let _initialized = false;

/**
 * Loads Paddle.js once and exposes openCheckout.
 *
 * Callbacks:
 *   onSuccess(data)  – checkout.completed  (data.transaction.id available)
 *   onError(data)    – checkout.error      (invalid price ID, network, etc.)
 *   onClosed()       – checkout.closed     (user dismissed overlay without paying)
 */
export function usePaddle({ onSuccess, onError, onClosed } = {}) {
  const [ready, setReady] = useState(_initialized);
  const cb = useRef({ onSuccess, onError, onClosed });

  // Keep callbacks fresh without re-running the effect.
  useEffect(() => {
    cb.current = { onSuccess, onError, onClosed };
  });

  useEffect(() => {
    if (_initialized) {
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
              console.error("[Paddle] checkout.error — name:", event.name);
              console.error("[Paddle] checkout.error — data:", JSON.stringify(event.data));
              console.error("[Paddle] checkout.error — code:", event.data?.code);
              console.error("[Paddle] checkout.error — detail:", event.data?.detail);
              cb.current.onError?.(event.data);
              break;

            case "checkout.closed":
              cb.current.onClosed?.();
              break;

            // checkout.warning fires for non-fatal issues (e.g. unsupported locale)
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

  /**
   * Opens the Paddle overlay checkout.
   * Returns false immediately if the price ID is clearly invalid.
   *
   * @param {string} priceId   Paddle Price ID (must start with "pri_")
   * @param {string} [email]   Pre-fill customer email
   * @param {object} [customData]  Metadata sent to webhook
   */
  function openCheckout({ priceId, email, customData } = {}) {
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
