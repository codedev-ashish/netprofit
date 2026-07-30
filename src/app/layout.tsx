import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import styles from "./layout.module.css";
import Link from "next/link";
import SiteLayout from "../components/SiteLayout";
import { ThemeProvider } from "../components/ThemeProvider";
import Script from "next/script";
import HTMLInjector from "../components/HTMLInjector";
import Tracker from "../components/Tracker";
import CanonicalTag from "../components/CanonicalTag";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { db } from "../lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  let adsData: any = null;
  try {
    const docSnap = await getDoc(doc(db, "settings", "ads"));
    if (docSnap.exists()) {
      adsData = docSnap.data();
    }
  } catch (err) { }

  // Parse searchConsoleCode using regex to find meta tags
  // e.g., <meta name="google-site-verification" content="XYZ" />
  const otherMeta: Record<string, string> = {};
  if (adsData?.searchConsoleCode) {
    const regex = /<meta\s+(?:name|property)=["']([^"']+)["']\s+content=["']([^"']+)["']/gi;
    let match;
    while ((match = regex.exec(adsData.searchConsoleCode)) !== null) {
      if (match[1].toLowerCase() !== 'robots') {
        otherMeta[match[1]] = match[2];
      }
    }
  }

  // Explicitly allow bingbot parsing
  otherMeta['bingbot'] = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';


  const decodeTitle = (t: any) => t ? String(t).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/gi, ' ') : t;
  return {
    metadataBase: new URL("https://netprofit.in"),
    title: {
      default: "Tax, Legal & Business Registration | NetProfit",
      template: "%s | NetProfit",
    },
    description: "NetProfit is your complete platform for GST, ITR filing, MSME & company registration in India. Simplify your business compliance with our expert CA services.",
    openGraph: {
      title: "Tax, Legal & Business Registration | NetProfit",
      description: "NetProfit is your complete platform for GST, ITR filing, MSME & company registration in India. Simplify your business compliance with our expert CA services.",
      siteName: "NetProfit",
      images: [
        {
          url: "https://netprofit.in/icon.svg",
          width: 512,
          height: 512,
        }
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Tax, Legal & Business Registration | NetProfit",
      description: "NetProfit is your complete platform for GST, ITR filing, MSME & company registration in India. Simplify your business compliance with our expert CA services.",
      images: ["https://netprofit.in/icon.svg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: otherMeta,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let adsData: any = null;
  let globalData: any = {};
  let headerFooterData: any = {};
  let topMenuItems: any[] = [];
  let mainMenuItems: any[] = [];
  let footerMenuItems: any[] = [];
  try {
    const docSnap = await getDoc(doc(db, "settings", "ads"));
    if (docSnap.exists()) {
      adsData = docSnap.data();
    }
  } catch (err) { }

  try {
    const docSnap = await getDoc(doc(db, "settings", "global"));
    if (docSnap.exists()) globalData = docSnap.data();
  } catch (err) { }

  try {
    const docSnap = await getDoc(doc(db, "settings", "header_footer"));
    if (docSnap.exists()) headerFooterData = docSnap.data();
  } catch (err) { }

  try {
    const q = query(collection(db, "menu_items"), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.isPublished === false) return;
      const item = { id: docSnap.id, label: data.label || '', url: data.url || '' };
      if (data.position === 'header_top') topMenuItems.push(item);
      else if (data.position === 'footer_bottom') footerMenuItems.push(item);
      else if (!data.position || data.position === 'header_main') mainMenuItems.push(item);
    });
  } catch (err) { }
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning={true} data-scroll-behavior="smooth">
      <head suppressHydrationWarning={true}>
        <link rel="preconnect" href="https://freeipapi.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://analytics.ahrefs.com" />
        <CanonicalTag />
        <HTMLInjector html={(adsData?.headCode || '') + (adsData?.globalScripts ? adsData.globalScripts.filter((s: any) => s.position === 'head').map((s: any) => '\n' + s.code).join('') : '')} />
        <HTMLInjector html={adsData?.analyticsCode} />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "name": "NetProfit",
                  "legalName": globalData.siteName || "NetProfit",
                  "url": "https://netprofit.in",
                  "logo": globalData.logoUrl || "https://netprofit.in/icon.svg",
                  "sameAs": [
                    globalData.socialLinks?.facebook || "https://facebook.com/netprofit.in",
                    globalData.socialLinks?.twitter || "https://twitter.com/netprofit_in",
                    globalData.socialLinks?.linkedin || "https://linkedin.com/company/netprofit-in",
                    globalData.socialLinks?.instagram || "https://instagram.com/netprofit.in"
                  ].filter(Boolean),
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": headerFooterData.aboutPhone || "+91-0000000000",
                    "contactType": "customer support",
                    "email": headerFooterData.aboutEmail || "contact@netprofit.in",
                    "areaServed": "IN",
                    "availableLanguage": ["English", "Hindi"]
                  },
                  "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "India",
                    "addressCountry": "IN"
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body suppressHydrationWarning={true}>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem={false}>
          <Tracker />
          <HTMLInjector html={(adsData?.bodyCode || '') + (adsData?.globalScripts ? adsData.globalScripts.filter((s: any) => s.position === 'body').map((s: any) => '\n' + s.code).join('') : '')} />
          <SiteLayout
            initialSiteName={globalData.siteName || "NetProfit"}
            initialLogoUrl={globalData.logoUrl || ""}
            initialSocialLinks={globalData.socialLinks || {}}
            initialFooterBlocks={headerFooterData.footerBlocks || []}
            initialShowAboutColumn={headerFooterData.showAboutColumn !== false}
            initialAboutDescription={headerFooterData.aboutDescription || ""}
            initialAboutPhone={headerFooterData.aboutPhone || ""}
            initialAboutPhoneIcon={headerFooterData.aboutPhoneIcon || "📞"}
            initialAboutEmail={headerFooterData.aboutEmail || ""}
            initialAboutEmailIcon={headerFooterData.aboutEmailIcon || "✉️"}
            initialTopMenuItems={topMenuItems}
            initialMainMenuItems={mainMenuItems}
            initialFooterMenuItems={footerMenuItems}
            initialWebsiteAds={adsData?.websiteAds}
          >
            {children}
          </SiteLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
