"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "./Navbar";
import styles from "../app/layout.module.css";
import React, { useEffect, useState } from "react";

import { TrendingUp, Send } from "lucide-react";

interface SiteLayoutProps {
  children: React.ReactNode;
  initialSiteName?: string;
  initialLogoUrl?: string;
  initialTopMenuItems?: { id: string; label: string; url: string }[];
  initialMainMenuItems?: { id: string; label: string; url: string }[];
  initialFooterMenuItems?: { id: string; label: string; url: string }[];
  initialFooterBlocks?: { title: string; links: { label: string; url: string }[] }[];
  initialShowAboutColumn?: boolean;
  initialAboutDescription?: string;
  initialAboutPhone?: string;
  initialAboutPhoneIcon?: string;
  initialAboutEmail?: string;
  initialAboutEmailIcon?: string;
  initialSocialLinks?: any;
  initialWebsiteAds?: any;
}

export default function SiteLayout({
  children,
  initialSiteName,
  initialLogoUrl,
  initialTopMenuItems,
  initialMainMenuItems,
  initialFooterMenuItems,
  initialFooterBlocks,
  initialShowAboutColumn,
  initialAboutDescription,
  initialAboutPhone,
  initialAboutPhoneIcon,
  initialAboutEmail,
  initialAboutEmailIcon,
  initialSocialLinks,
  initialWebsiteAds
}: SiteLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [siteName, setSiteName] = useState(initialSiteName || "NetProfit");
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl || "");
  const [topMenuItems, setTopMenuItems] = useState<{ id: string; label: string; url: string }[]>(initialTopMenuItems || []);
  const [mainMenuItems, setMainMenuItems] = useState<{ id: string; label: string; url: string }[]>(initialMainMenuItems || []);
  const [footerMenuItems, setFooterMenuItems] = useState<{ id: string; label: string; url: string }[]>(initialFooterMenuItems || []);

  // Footer settings
  const [footerBlocks, setFooterBlocks] = useState<{ title: string; links: { label: string; url: string }[] }[]>(initialFooterBlocks?.length ? initialFooterBlocks : [
    {
      title: "Corporate Services",
      links: [
        { label: "Company Registration", url: "/services/company-registration" },
        { label: "LLP Registration", url: "/services/llp-registration" },
        { label: "OPC Registration", url: "/services/opc-registration" },
        { label: "Nidhi Company", url: "/services/nidhi-company" }
      ]
    },
    {
      title: "Licensing",
      links: [
        { label: "FSSAI License", url: "/services/fssai-license" },
        { label: "Trade License", url: "/services/trade-license" },
        { label: "MSME Registration", url: "/services/msme-registration" },
        { label: "Trademark Registration", url: "/services/trademark" }
      ]
    },
    {
      title: "Accounting & Tax",
      links: [
        { label: "GST Registration", url: "/services/gst-registration" },
        { label: "GST Return Filing", url: "/services/gst-return" },
        { label: "Income Tax Filing", url: "/services/income-tax" },
        { label: "TDS Return Filing", url: "/services/tds-return" }
      ]
    }
  ]);
  const [showAboutColumn, setShowAboutColumn] = useState(initialShowAboutColumn !== undefined ? initialShowAboutColumn : true);
  const [aboutDescription, setAboutDescription] = useState(initialAboutDescription || "");
  const [aboutPhone, setAboutPhone] = useState(initialAboutPhone || "");
  const [aboutPhoneIcon, setAboutPhoneIcon] = useState(initialAboutPhoneIcon || "📞");
  const [aboutEmail, setAboutEmail] = useState(initialAboutEmail || "");
  const [aboutEmailIcon, setAboutEmailIcon] = useState(initialAboutEmailIcon || "✉️");
  const [socialLinks, setSocialLinks] = useState(initialSocialLinks || { facebook: "", twitter: "", instagram: "", linkedin: "", whatsapp: "", telegram: "" });

  useEffect(() => {
    if (!isAdmin) {
      const injectHTML = (html: string, target: HTMLElement) => {
        if (!html) return;
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Replace all inert scripts with active scripts
        const scripts = temp.querySelectorAll('script');
        scripts.forEach(scriptNode => {
          const newScript = document.createElement('script');
          Array.from(scriptNode.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
          newScript.text = scriptNode.text || scriptNode.innerHTML;
          scriptNode.parentNode?.replaceChild(newScript, scriptNode);
        });

        // Append all children to target
        while (temp.firstChild) {
          target.appendChild(temp.firstChild);
        }
      };

      if (initialWebsiteAds?.enabled && Array.isArray(initialWebsiteAds?.placements)) {
        initialWebsiteAds.placements.forEach((ad: any) => {
          if (!ad.code) return;
          const container = document.getElementById(`ad-${ad.position}`);
          if (container) {
            injectHTML(ad.code, container);
          } else if (ad.position === 'head') {
            injectHTML(ad.code, document.head);
          }
        });
      }
    }
  }, [initialWebsiteAds, isAdmin]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <div id="ad-top_header" suppressHydrationWarning />
      {topMenuItems.length > 0 && (
        <div className={styles.topHeader}>
          {topMenuItems.map(item => (
            <Link key={item.id} href={item.url}>{item.label}</Link>
          ))}
        </div>
      )}
      <header className={styles.header}>
        <div className={styles.logo} suppressHydrationWarning={true}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            {logoUrl ? (
              <div style={{ height: '32px', width: '150px', display: 'flex', alignItems: 'center' }}>
                <Image src={logoUrl} alt="Logo" width={150} height={32} priority style={{ height: '100%', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} />
              </div>
            ) : (
              <TrendingUp style={{ color: 'var(--accent-color)' }} size={28} />
            )}
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-text-color)' }}>
              {siteName}
            </span>
          </Link>
        </div>
        <Navbar initialMenuItems={mainMenuItems} />
      </header>
      <div id="ad-below_header" suppressHydrationWarning />
      <main className={styles.mainContent}>
        {children}
      </main>
      <div id="ad-above_footer" suppressHydrationWarning />
      <footer className={styles.footer} suppressHydrationWarning={true}>
        <div className={styles.footerGrid} suppressHydrationWarning={true}>
          {showAboutColumn && (
            <div className={styles.footerCol} suppressHydrationWarning={true}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }} suppressHydrationWarning={true}>
                {logoUrl ? (
                  <div style={{ height: '24px', width: '120px', display: 'flex', alignItems: 'center' }} suppressHydrationWarning={true}>
                    <Image src={logoUrl} alt="Logo" width={120} height={24} style={{ height: '100%', width: 'auto', maxWidth: '100%', objectFit: 'contain' }} suppressHydrationWarning={true} />
                  </div>
                ) : (
                  <TrendingUp style={{ color: 'var(--accent-color)' }} size={24} suppressHydrationWarning={true} />
                )}
                <h3 className={styles.footerTitle} style={{ margin: 0 }}>{siteName}</h3>
              </div>
              <p suppressHydrationWarning={true}>{aboutDescription}</p>
              {aboutPhone && <p className={styles.contact} suppressHydrationWarning={true}>{aboutPhoneIcon} {aboutPhone}</p>}
              {aboutEmail && <p className={styles.contact} suppressHydrationWarning={true}>{aboutEmailIcon} {aboutEmail}</p>}
              {(socialLinks.facebook || socialLinks.twitter || socialLinks.instagram || socialLinks.linkedin || socialLinks.whatsapp || socialLinks.telegram) && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }} suppressHydrationWarning={true}>
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#1877F2', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="Facebook">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#000000', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="X (Twitter)">
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="Instagram">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#0A66C2', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="LinkedIn">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                    </a>
                  )}
                  {socialLinks.whatsapp && (
                    <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#25D366', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="WhatsApp">
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </a>
                  )}
                  {socialLinks.telegram && (
                    <a href={socialLinks.telegram} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: '#0088cc', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="Telegram">
                      <Send size={16} />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
          {footerBlocks.map((block, idx) => (
            <div key={idx} className={styles.footerCol} suppressHydrationWarning={true}>
              <h3 className={styles.footerHeading} suppressHydrationWarning={true}>{block.title}</h3>
              {block.links.map((link, lIdx) => (
                <Link key={lIdx} href={link.url} suppressHydrationWarning={true}>{link.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.footerBottom} suppressHydrationWarning={true}>
          {footerMenuItems.length > 0 && (
            <div className={styles.footerBottomLinks} suppressHydrationWarning={true}>
              {footerMenuItems.map(item => (
                <Link key={item.id} href={item.url}>{item.label}</Link>
              ))}
            </div>
          )}
          <p>
            <Link href="/sitemap" style={{ marginRight: '1rem', color: 'inherit', textDecoration: 'none' }}>HTML Sitemap</Link>
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
        </div>
      </footer>
      <div id="ad-below_footer" suppressHydrationWarning />
    </>
  );
}
