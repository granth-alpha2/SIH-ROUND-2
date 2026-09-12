import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./shell.css";

export const metadata: Metadata = {
  title: "AgriProfit | Better harvests, planned",
  description: "An explainable crop and farm profit planning workspace.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const m = localStorage.getItem('agriprofit_mode') || (localStorage.getItem('agriprofit_theme') === 'night' ? 'night' : 'day');
                const ec = localStorage.getItem('agriprofit_eyecare') === 'true' || localStorage.getItem('agriprofit_theme') === 'eyecare';
                const hc = localStorage.getItem('agriprofit_high_contrast') === 'true';
                const fs = localStorage.getItem('agriprofit_font_size') || 'md';
                const t = hc ? 'high-contrast' : (ec ? m + '-eyecare' : m);
                document.documentElement.setAttribute('data-theme', t);
                document.documentElement.setAttribute('data-mode', m);
                document.documentElement.setAttribute('data-eyecare', ec ? 'true' : 'false');
                document.documentElement.setAttribute('data-contrast', hc ? 'high' : 'normal');
                document.documentElement.setAttribute('data-font-size', fs);
              } catch (e) {}
            `,
          }}
        />
      </head>

      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

