"use client";

import React, { useState } from "react";
import AppShell from "../../components/AppShell";
import MarketplaceNavHeader from "../components/MarketplaceNavHeader";
import GroupSellingBoard from "../components/GroupSellingBoard";
import { MarketplaceUserRole } from "@/lib/marketplace-types";

export default function GroupsPage() {
  const [currentRole, setCurrentRole] = useState<MarketplaceUserRole>("farmer");

  return (
    <AppShell pageTitle="Farmer Group Selling & Cooperative Aggregation">
      <div className="space-y-6">
        <MarketplaceNavHeader
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
        />
        <GroupSellingBoard />
      </div>
    </AppShell>
  );
}

