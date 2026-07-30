"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import styles from "../app/layout.module.css";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ initialMenuItems }: { initialMenuItems?: { id: string; label: string; url: string }[] }) {
  const [user, setUser] = useState<any | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<{ id: string; label: string; url: string }[]>(initialMenuItems || []);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {

    let unsubscribe: any;
    
    // Dynamically import auth to prevent Unused JS on public pages
    Promise.all([
      import("../lib/firebase-auth"),
      import("firebase/auth")
    ]).then(([{ auth }, { onAuthStateChanged }]) => {
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          try {
            const { db } = await import("../lib/firebase");
            const { doc, getDoc } = await import("firebase/firestore");
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
              setUserName(userDoc.data().name || currentUser.displayName || "");
            } else {
              setUserName(currentUser.displayName || "");
            }
          } catch (error) {
            console.error("Error fetching name in navbar:", error);
            setUserName(currentUser.displayName || "");
          }
        } else {
          setUserName("");
        }
        setLoading(false);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const [{ auth }, { signOut }] = await Promise.all([
      import("../lib/firebase-auth"),
      import("firebase/auth")
    ]);
    await signOut(auth);
  };

  return (
    <>
      <button className={styles.mobileMenuBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle mobile menu">
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.mobileOpen : ""}`} onClick={() => setIsMobileMenuOpen(false)}>
        <>
          {menuItems.length > 0 ? (
            menuItems.map(item => (
              <Link key={item.id} href={item.url} className={styles.navLink}>
                {item.label}
              </Link>
            ))
          ) : (
            <>
              <Link href={user ? "/user/services" : "/services"} className={styles.navLink}>Services</Link>
              <Link href="/tools" className={styles.navLink}>Tools</Link>
              <Link href="/news" className={styles.navLink}>News</Link>
              <Link href="/ipo" className={styles.navLink}>IPOs</Link>
            </>
          )}
        </>

        {!loading && user ? (
          <div className={styles.userMenu}>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <div
              className={styles.accountDropdownContainer}
              onMouseEnter={() => setIsAccountOpen(true)}
              onMouseLeave={() => setIsAccountOpen(false)}
            >
              <span
                className={styles.navLink}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsAccountOpen(!isAccountOpen);
                }}
              >
                Account <span style={{ fontSize: '0.8rem' }}>▼</span>
              </span>
              {isAccountOpen && (
                <div
                  className={styles.accountDropdownMenu}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Profile section with name and email */}
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color, #eaeaea)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-color, #333)', fontSize: '0.95rem' }}>{userName || 'User Profile'}</div>
                    <div style={{ color: 'var(--text-muted, #666)', fontSize: '0.8rem', wordBreak: 'break-all' }}>{user.email}</div>
                  </div>

                  <Link href="/dashboard/settings" style={{ padding: '0.75rem 1rem', textDecoration: 'none', color: 'var(--text-color, #333)', fontSize: '0.95rem', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary, #f5f5f5)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Setting</Link>
                  <button
                    onClick={handleLogout}
                    style={{ background: 'transparent', border: 'none', borderTop: '1px solid var(--border-color, #eaeaea)', cursor: 'pointer', color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', width: '100%', textAlign: 'left', fontSize: '0.95rem', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(229, 62, 62, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          !loading && <Link href="/auth" className={styles.navLink}>Login</Link>
        )}

        <div suppressHydrationWarning style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ThemeToggle />
          <div suppressHydrationWarning className={styles.searchBarWrapper}>
            <SearchBar />
          </div>
        </div>
      </nav>
    </>
  );
}
