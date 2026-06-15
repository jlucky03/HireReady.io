import React, { useEffect, useState } from "react";

export default function PaymentHistory({ onClose }) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(apiUrl("/api/payments/history"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setPayments(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#151D30] border border-gray-800 rounded-2xl p-6 w-full max-w-3xl">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4">
          <h2 className="text-xl font-black text-white">
            Billing History
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {payments.length === 0 ? (
            <p className="text-gray-400">No payments found.</p>
          ) : (
            payments.map((p) => (
              <div
                key={p._id}
                className="bg-[#0B0F19] border border-gray-800 rounded-xl p-4 flex justify-between"
              >
                <div>
                  <p className="text-white font-bold">
                    +{p.credits} Credits
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-white font-bold">
                    ₹{p.amount / 100}
                  </p>
                  <p className="text-green-400 text-sm">
                    {p.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}