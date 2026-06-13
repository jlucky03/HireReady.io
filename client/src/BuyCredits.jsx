import React, { useState } from "react";
import { useAuthStore } from "./store/authStore";

const plans = [
  { id: "starter", name: "Starter", credits: 10, price: 99 },
  { id: "growth", name: "Growth", credits: 25, price: 199 },
  { id: "pro", name: "Pro", credits: 50, price: 349 },
];

export default function BuyCredits({ onClose, showToast }) {
  const [loadingPlan, setLoadingPlan] = useState("");
  const { user, setUser } = useAuthStore();

  const loadRazorpay = () =>
    new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const buyPlan = async (planId) => {
    setLoadingPlan(planId);

    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay SDK failed to load.");

      const token = localStorage.getItem("token");

      const orderRes = await fetch("http://localhost:5000/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planId }),
      });

      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.message || "Order creation failed.");

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "HireReady AI",
        description: `${order.credits} Credits Purchase`,
        order_id: order.orderId,
        handler: async (response) => {
          const verifyRes = await fetch("http://localhost:5000/api/payments/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(response),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData.message || "Payment verification failed.");

          setUser({ ...user, credits: verifyData.credits });
          showToast("Credits added successfully!");
          onClose();
        },
        theme: { color: "#7C3AED" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      showToast(err.message || "Payment failed.");
    } finally {
      setLoadingPlan("");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#151D30] border border-gray-800 rounded-2xl p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white">Buy Credits</h2>
            <p className="text-xs text-gray-400 mt-1">
              Use credits for ATS scans and AI interviews.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {plans.map((p) => (
            <div key={p.id} className="bg-[#0B0F19] border border-gray-800 rounded-2xl p-5">
              <h3 className="text-white font-bold">{p.name}</h3>
              <p className="text-3xl font-black text-purple-400 mt-3">{p.credits}</p>
              <p className="text-xs text-gray-500">credits</p>
              <p className="text-lg font-bold text-white mt-4">₹{p.price}</p>

              <button
                onClick={() => buyPlan(p.id)}
                disabled={loadingPlan === p.id}
                className="w-full mt-5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold uppercase py-2.5 rounded-xl"
              >
                {loadingPlan === p.id ? "Processing..." : "Buy Now"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}