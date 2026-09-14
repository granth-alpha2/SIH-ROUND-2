"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/TranslationContext";

interface TranslatedTextProps {
  text: string;
  context?: string;
  className?: string;
  as?: React.ElementType;
  showOriginalOnHover?: boolean;
}

export default function TranslatedText({
  text,
  context,
  className = "",
  as: Component = "span",
  showOriginalOnHover = false,
}: TranslatedTextProps) {
  const { language, translateDynamic } = useTranslation();
  const [translated, setTranslated] = useState(text);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!text || !text.trim() || language === "en") {
      setTranslated(text);
      return;
    }

    async function doTranslate() {
      setLoading(true);
      try {
        const res = await translateDynamic(text, context);
        if (isMounted) {
          setTranslated(res);
        }
      } catch {
        if (isMounted) {
          setTranslated(text);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    doTranslate();

    return () => {
      isMounted = false;
    };
  }, [text, language, context, translateDynamic]);

  return (
    <Component
      className={`${className} ${loading ? "opacity-75 transition-opacity" : ""}`}
      title={showOriginalOnHover && translated !== text ? `Original: ${text}` : undefined}
    >
      {translated}
    </Component>
  );
}
