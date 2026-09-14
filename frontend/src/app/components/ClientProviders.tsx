"use client";

import React from "react";
import { TranslationProvider } from "@/lib/i18n/TranslationContext";
import { PageAudioProvider } from "@/lib/i18n/PageAudioRegistry";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <TranslationProvider>
      <PageAudioProvider>
        {children}
      </PageAudioProvider>
    </TranslationProvider>
  );
}
