"use client";

import React, { useState, useEffect } from "react";
import { GroupSellingGroup } from "@/lib/marketplace-types";

export default function GroupSellingBoard() {
  const [groups, setGroups] = useState<GroupSellingGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Join Group Modal
  const [joiningGroup, setJoiningGroup] = useState<GroupSellingGroup | null>(null);
  const [contributeQty, setContributeQty] = useState<number>(15);
  const [joining, setJoining] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create Group Modal
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newCropName, setNewCropName] = useState("Wheat");
  const [newTargetQty, setNewTargetQty] = useState<number>(50);
  const [newInitialQty, setNewInitialQty] = useState<number>(15);
  const [newMinPrice, setNewMinPrice] = useState<number>(2380);
  const [creatingGroup, setCreatingGroup] = useState(false);

  async function loadGroups() {
    try {
      const res = await fetch("/api/marketplace/groups");
      if (res.ok) {
        const json = await res.json();
        setGroups(json.groups || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroups();
  }, []);

  // Handle Join Group
  async function handleJoinGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!joiningGroup) return;
    setJoining(true);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/marketplace/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "JOIN",
          groupId: joiningGroup.id,
          farmerName: "Gurpreet Singh",
          farmerPhone: "9876543210",
          quantityQuintals: contributeQty,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`✓ Successfully contributed ${contributeQty} quintals to ${joiningGroup.groupCode}!`);
        setJoiningGroup(null);
        await loadGroups();
      }
    } catch {} finally {
      setJoining(false);
    }
  }

  // Handle Create Group
  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    setCreatingGroup(true);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/marketplace/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          cropName: newCropName,
          cropSlug: newCropName.toLowerCase().split(" ")[0],
          targetQuantityQuintals: newTargetQty,
          initialQuantityQuintals: newInitialQty,
          minAcceptablePriceInr: newMinPrice,
          farmerName: "Gurpreet Singh",
          farmerPhone: "9876543210",
          district: "Ludhiana",
          state: "Punjab",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`✓ Selling Group ${data.group.groupCode} opened! Other farmers can now join.`);
        setShowCreateGroup(false);
        await loadGroups();
      }
    } catch {} finally {
      setCreatingGroup(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Farmer Group Selling & Cooperative Aggregation
            </h2>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl mt-1">
            Small farmers often cannot supply institutional quantities alone. Pool your produce with nearby growers to fulfill bulk buyer requirements, reduce freight costs, and command premium pricing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateGroup(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer ml-auto"
        >
          <span>➕</span>
          <span>Open New Selling Group</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold">
          {successMsg}
        </div>
      )}

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g) => {
          const progressPct = Math.min(100, Math.round((g.pooledQuantityQuintals / g.targetQuantityQuintals) * 100));

          return (
            <div
              key={g.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-emerald-600 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded text-[10px] font-mono font-bold">
                      {g.groupCode}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {g.cropName} Aggregation Pool
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      📍 {g.district}, {g.state} · Min Price: ₹{g.minAcceptablePriceInr}/q
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      g.status === "TARGET_REACHED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {g.status.replace("_", " ")}
                  </span>
                </div>

                {/* Aggregation Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">
                      Pooled: <strong className="text-emerald-700">{g.pooledQuantityQuintals} q</strong> / {g.targetQuantityQuintals} q
                    </span>
                    <span className="text-emerald-700 font-black">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Explainable Matching Score (Prompt 23) */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <span>🎯</span> Group Compatibility Match Score:
                    </span>
                    <span className="font-black text-emerald-700 text-sm">
                      {g.compatibilityScore}/100
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                    <div>Crop Match: <strong className="text-slate-900">100%</strong></div>
                    <div>Quantity Fit: <strong className="text-slate-900">95%</strong></div>
                    <div>Proximity: <strong className="text-slate-900">91%</strong></div>
                    <div>Price Sync: <strong className="text-slate-900">88%</strong></div>
                  </div>
                </div>

                {/* Members List */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">
                    Contributing Farmers ({g.members.length}):
                  </span>
                  <div className="space-y-1">
                    {g.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg border border-slate-150"
                      >
                        <div>
                          <strong className="text-slate-900">{m.farmerName}</strong>
                          <span className="text-[10px] text-slate-500 block">{m.village || "Local Tehsil"}</span>
                        </div>
                        <span className="font-black text-emerald-800">{m.contributedQuantityQuintals} quintals</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setJoiningGroup(g);
                    setContributeQty(15);
                  }}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer shadow-sm"
                >
                  Join This Group (+ Add Quantity)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Join Group Modal */}
      {joiningGroup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base">Join Selling Group</h3>
                <p className="text-xs text-slate-500 font-semibold">{joiningGroup.groupCode} · {joiningGroup.cropName}</p>
              </div>
              <button
                type="button"
                onClick={() => setJoiningGroup(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinGroup} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Contribution (Quintals)</label>
                <input
                  type="number"
                  min="1"
                  value={contributeQty}
                  onChange={(e) => setContributeQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-black text-emerald-800 text-sm"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-950 block">
                  Pool will increase from <strong>{joiningGroup.pooledQuantityQuintals} q</strong> to{" "}
                  <strong>{joiningGroup.pooledQuantityQuintals + contributeQty} q</strong> (Target: {joiningGroup.targetQuantityQuintals} q).
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setJoiningGroup(null)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining}
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  {joining ? "Joining..." : "Confirm & Join Pool"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">Open New Farmer Selling Group</h3>
              <button
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Crop</label>
                <select
                  value={newCropName}
                  onChange={(e) => setNewCropName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="Wheat">Wheat</option>
                  <option value="Rapeseed & Mustard">Rapeseed & Mustard</option>
                  <option value="Gram (Chickpea)">Gram (Chickpea)</option>
                  <option value="Onion">Onion</option>
                  <option value="Tomato">Tomato</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Demand (q)</label>
                  <input
                    type="number"
                    value={newTargetQty}
                    onChange={(e) => setNewTargetQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Your Initial Qty (q)</label>
                  <input
                    type="number"
                    value={newInitialQty}
                    onChange={(e) => setNewInitialQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Minimum Acceptable Price (₹ / quintal)</label>
                <input
                  type="number"
                  value={newMinPrice}
                  onChange={(e) => setNewMinPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-emerald-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  {creatingGroup ? "Opening Group..." : "Open Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

