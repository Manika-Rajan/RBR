import React, { useEffect, useMemo, useState } from "react";

const CREATE_ORDER_URL = "https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod/instant-report/create-order";
const CONFIRM_URL      = "https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod/instant-report/confirm";

// Loads Razorpay checkout script once
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function InstantRazorpayTest() {
  const [query, setQuery] = useState("restaurant industry in India");
  const [userPhone, setUserPhone] = useState("919160885962");

  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("idle"); // idle | creating_order | paying | confirming | done | error
  const [orderResp, setOrderResp] = useState(null);
  const [confirmResp, setConfirmResp] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRazorpay(); // preload
  }, []);

  const canPay = useMemo(() => {
    return query.trim().length > 2 && userPhone.trim().length >= 10 && !busy;
  }, [query, userPhone, busy]);

  async function handlePay() {
    setError(null);
    setConfirmResp(null);
    setOrderResp(null);

    const ok = await loadRazorpay();
    if (!ok) {
      setError("Razorpay script failed to load. Check network / adblock.");
      return;
    }

    setBusy(true);
    setStage("creating_order");

    try {
      // 1) Create Razorpay order via your Lambda
      const createRes = await fetch(CREATE_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createJson?.error || `Create order failed: HTTP ${createRes.status}`);
      }

      // Expected from your lambda:
      // { razorpayKeyId, razorpayOrderId, amount, currency, receipt }
      const { razorpayKeyId, razorpayOrderId, amount, currency } = createJson || {};
      if (!razorpayKeyId || !razorpayOrderId || !amount || !currency) {
        throw new Error("Create order response missing required fields (key/orderId/amount/currency).");
      }

      setOrderResp(createJson);

      setStage("paying");

      // 2) Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount, // paise
        currency,
        name: "Rajan Business Reports",
        description: "Instant report test payment",
        order_id: razorpayOrderId,
        prefill: {
          contact: userPhone.startsWith("+") ? userPhone : `+${userPhone}`,
        },
        notes: {
          query,
          userPhone,
        },
        theme: { color: "#1a73e8" },

        // 3) On payment success -> call confirm lambda
        handler: async function (response) {
          // response = { razorpay_payment_id, razorpay_order_id, razorpay_signature }
          try {
            setStage("confirming");

            const confirmPayload = {
              query: query.trim(),
              userPhone: userPhone.trim(),
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            };

            const confirmRes = await fetch(CONFIRM_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(confirmPayload),
            });

            const confirmJson = await confirmRes.json();

            if (!confirmRes.ok) {
              throw new Error(confirmJson?.error || `Confirm failed: HTTP ${confirmRes.status}`);
            }

            setConfirmResp(confirmJson);
            setStage("done");
          } catch (e) {
            setError(e?.message || String(e));
            setStage("error");
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            // user closed checkout
            setBusy(false);
            setStage("idle");
          },
        },
      });

      rzp.open();
    } catch (e) {
      setError(e?.message || String(e));
      setStage("error");
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16, fontFamily: "system-ui, Arial" }}>
      <h2 style={{ marginBottom: 6 }}>Instant Razorpay Test</h2>
      <div style={{ color: "#555", marginBottom: 16 }}>
        Flow: Create Order → Razorpay Checkout → Confirm & Generate → Show Response
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Query</div>
          <textarea
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>

        <label>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>User Phone (E.164 without + is ok)</div>
          <input
            value={userPhone}
            onChange={(e) => setUserPhone(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
            placeholder="919160885962"
          />
        </label>

        <button
          onClick={handlePay}
          disabled={!canPay}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "none",
            fontWeight: 700,
            cursor: canPay ? "pointer" : "not-allowed",
          }}
        >
          {busy ? "Working..." : "Pay ₹1 (test) and Generate"}
        </button>

        <div style={{ fontSize: 14, color: "#444" }}>
          Stage: <b>{stage}</b>
          {orderResp?.amount ? (
            <>
              {" "}• Amount returned by create-order: <b>₹{(orderResp.amount / 100).toFixed(2)}</b>
            </>
          ) : null}
        </div>

        {error ? (
          <div style={{ padding: 12, borderRadius: 10, background: "#ffe8e8", color: "#8a0000" }}>
            <b>Error:</b> {error}
          </div>
        ) : null}

        {orderResp ? (
          <div style={{ padding: 12, borderRadius: 10, background: "#f6f8ff", border: "1px solid #d9e1ff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Create Order Response</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(orderResp, null, 2)}</pre>
          </div>
        ) : null}

        {confirmResp ? (
          <div style={{ padding: 12, borderRadius: 10, background: "#f1fff2", border: "1px solid #bfe8c4" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Confirm & Generate Response</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{JSON.stringify(confirmResp, null, 2)}</pre>
          </div>
        ) : null}
      </div>

      <div style={{ fontSize: 12, color: "#666" }}>
        Tip: To truly charge ₹1, set your create-order Lambda env var (e.g. <code>INSTANT_AMOUNT_PAISE</code>) to <b>100</b>.
      </div>
    </div>
  );
}
