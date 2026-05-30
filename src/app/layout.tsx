import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";
import Link from "next/link";
import SiteLayout from "../components/SiteLayout";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NetProfit | GST, ITR Filing & Company Registration in India",
  description: "One Platform for All Your Tax, Legal & Business Registration Needs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning={true}>
      <head>
        <Script id="remove-bis" strategy="beforeInteractive">
          {`
            (function() {
              const removeBis = (node) => {
                if (!node) return;
                if (node.removeAttribute && node.hasAttribute('bis_skin_checked')) {
                  node.removeAttribute('bis_skin_checked');
                }
                if (node.querySelectorAll) {
                  node.querySelectorAll('[bis_skin_checked]').forEach(el => el.removeAttribute('bis_skin_checked'));
                }
              };
              const observer = new MutationObserver((mutations) => {
                for (let i = 0; i < mutations.length; i++) {
                  const m = mutations[i];
                  if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                    removeBis(m.target);
                  }
                  if (m.addedNodes) {
                    for (let j = 0; j < m.addedNodes.length; j++) {
                      removeBis(m.addedNodes[j]);
                    }
                  }
                }
              });
              observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['bis_skin_checked']
              });
              document.addEventListener('DOMContentLoaded', () => {
                removeBis(document.documentElement);
              });
            })();
          `}
        </Script>
      </head>
      <body suppressHydrationWarning={true}>
        <SiteLayout>
          {children}
        </SiteLayout>
      </body>
    </html>
  );
}
