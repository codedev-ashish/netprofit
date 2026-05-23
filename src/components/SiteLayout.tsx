"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "./Navbar";
import styles from "../app/layout.module.css";
import React, { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { TrendingUp } from "lucide-react";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const [siteName, setSiteName] = useState("NetProfit");
  const [logoUrl, setLogoUrl] = useState("");
  const [topMenuItems, setTopMenuItems] = useState<{ id: string; label: string; url: string }[]>([]);
  const [footerMenuItems, setFooterMenuItems] = useState<{ id: string; label: string; url: string }[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.siteName) setSiteName(data.siteName);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          
          if (data.siteTitle) {
            document.title = data.siteTitle;
          }
          if (data.faviconUrl) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = data.faviconUrl;
          }
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };

    const fetchMenus = async () => {
      try {
        const q = query(collection(db, "menu_items"), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        const top: any[] = [];
        const bottom: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.position === 'header_top') top.push({ id: doc.id, ...data });
          if (data.position === 'footer_bottom') bottom.push({ id: doc.id, ...data });
        });
        setTopMenuItems(top);
        setFooterMenuItems(bottom);
      } catch (err) {
        console.error("Error fetching layout menus:", err);
      }
    };

    fetchSettings();
    fetchMenus();
  }, []);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {topMenuItems.length > 0 && (
        <div className={styles.topHeader}>
          {topMenuItems.map(item => (
            <Link key={item.id} href={item.url}>{item.label}</Link>
          ))}
        </div>
      )}
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
            ) : (
              <TrendingUp style={{ color: '#f97316' }} size={28} />
            )}
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-color)' }}>
              {siteName}
            </span>
          </Link>
        </div>
        <Navbar />
      </header>
      <main className={styles.mainContent}>
        {children}
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerCol}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ height: '24px', objectFit: 'contain' }} />
              ) : (
                <TrendingUp style={{ color: '#f97316' }} size={24} />
              )}
              <h3 className={styles.footerTitle} style={{ margin: 0 }}>{siteName}</h3>
            </div>
            <p>One Platform for All Your Tax, Legal & Business Registration Needs.</p>
            <p className={styles.contact}>📞 (+91) 87500 70081</p>
            <p className={styles.contact}>✉️ wecare@netprofit.com</p>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerHeading}>Corporate Services</h4>
            <Link href="/services/company-registration">Company Registration</Link>
            <Link href="/services/llp-registration">LLP Registration</Link>
            <Link href="/services/opc-registration">OPC Registration</Link>
            <Link href="/services/nidhi-company">Nidhi Company</Link>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerHeading}>Licensing</h4>
            <Link href="/services/fssai-license">FSSAI License</Link>
            <Link href="/services/trade-license">Trade License</Link>
            <Link href="/services/msme-registration">MSME Registration</Link>
            <Link href="/services/trademark">Trademark Registration</Link>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerHeading}>Accounting & Tax</h4>
            <Link href="/services/gst-registration">GST Registration</Link>
            <Link href="/services/gst-return">GST Return Filing</Link>
            <Link href="/services/income-tax">Income Tax Filing</Link>
            <Link href="/services/tds-return">TDS Return Filing</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          {footerMenuItems.length > 0 && (
            <div className={styles.footerBottomLinks}>
              {footerMenuItems.map(item => (
                <Link key={item.id} href={item.url}>{item.label}</Link>
              ))}
            </div>
          )}
          <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
