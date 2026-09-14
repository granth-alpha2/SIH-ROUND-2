"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { PageAudioPayload, PageAudioSection } from "../translation/translation-types";

interface PageAudioContextType {
  activePageAudio: PageAudioPayload | null;
  registerPageAudio: (payload: PageAudioPayload) => void;
  clearPageAudio: (pagePath?: string) => void;
}

const PageAudioContext = createContext<PageAudioContextType | null>(null);

export function PageAudioProvider({ children }: { children: React.ReactNode }) {
  const [activePageAudio, setActivePageAudio] = useState<PageAudioPayload | null>(null);

  const registerPageAudio = useCallback((payload: PageAudioPayload) => {
    setActivePageAudio(payload);
  }, []);

  const clearPageAudio = useCallback((pagePath?: string) => {
    setActivePageAudio((prev) => {
      if (!pagePath || prev?.pagePath === pagePath) {
        return null;
      }
      return prev;
    });
  }, []);

  return (
    <PageAudioContext.Provider
      value={{
        activePageAudio,
        registerPageAudio,
        clearPageAudio,
      }}
    >
      {children}
    </PageAudioContext.Provider>
  );
}

export function usePageAudioRegistry() {
  const context = useContext(PageAudioContext);
  if (!context) {
    throw new Error("usePageAudioRegistry must be used within a PageAudioProvider");
  }
  return context;
}

/**
 * Convenient hook for individual pages to register their readable audio summary
 */
export function usePageAudioContent(payload: {
  title: string;
  summary: string;
  sections?: PageAudioSection[];
  dependencies?: unknown[];
}) {
  const { registerPageAudio } = usePageAudioRegistry();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pagePath = window.location.pathname;

    registerPageAudio({
      title: payload.title,
      summary: payload.summary,
      pagePath,
      sections: payload.sections || [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload.title, payload.summary, ...(payload.dependencies || [])]);
}
