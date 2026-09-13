"use client";

import React, { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";
import MarketplaceNavHeader from "../components/MarketplaceNavHeader";
import ProcurementReceiptModal from "../components/ProcurementReceiptModal";
import { MarketplaceTransaction, MarketplaceUserRole, ProcurementReceipt } from "@/lib/marketplace-types";

export default function TransactionsPage() {
  const [currentRole, setCurrentRole] = useState<MarketplaceUserRole>("farmer");
  const [transactions, setTransactions] = useState<MarketplaceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingReceipt, setViewingReceipt] = useState<ProcurementReceipt | null>(null);

  async function loadTransactions() {
    try {
      const res = await fetch("/api/marketplace/transactions");
      if (res.ok) {
        const json = await res.json();
        setTransactions(json.transactions || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <AppShell pageTitle="Marketplace Transactions & Payout Ledger">
      <div className="space-y-6">
        <MarketplaceNavHeader
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
        />

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Unified Transaction Ledger</h2>
              <p className="text-xs text-slate-500">
                Official procurement records, direct market escrow settlements, and demo PFMS/DBT disbursements
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {transactions.length} Total Records
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <span className="text-3xl block mb-2">📑</span>
              No completed transactions yet. Once MSP procurement or direct offers are accepted, records appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Transaction ID</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Farmer</th>
                    <th className="p-3">Buyer / Center</th>
                    <th className="p-3">Crop</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Gross Value</th>
                    <th className="p-3">Payment Status</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{tx.id}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            tx.transactionType === "MSP_PROCUREMENT"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {tx.transactionType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-900">{tx.farmerName}</td>
                      <td className="p-3 text-slate-600">{tx.buyerName}</td>
                      <td className="p-3 font-bold text-slate-800">{tx.cropName}</td>
                      <td className="p-3 font-bold text-slate-900">{tx.quantityQuintals} q</td>
                      <td className="p-3 font-black text-emerald-700">
                        ₹{tx.grossAmountInr.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold">
                          Paid — Demo
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-3 text-right">
                        {tx.receiptDetails ? (
                          <button
                            type="button"
                            onClick={() => setViewingReceipt(tx.receiptDetails!)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            View Receipt
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ProcurementReceiptModal
          receipt={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      </div>
    </AppShell>
  );
}

