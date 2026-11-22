"use client";

import Loader from "../../components/Loader";

import { useEffect, useState } from "react";
import styles from "./layout.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { db } from "../../lib/firebase";
import { auth } from "../../lib/firebase-auth";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  LayoutDashboard,
  Briefcase,
  Newspaper,
  MenuSquare,
  MessageSquare,
  FileText,
  Users,
  Bell,
  Smartphone,
  Settings,
  LogOut,
  TrendingUp,
  Calculator,
  MessageCircleQuestion,
  Menu,
  X
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const pathname = usePathname();
  const [siteName, setSiteName] = useState("NetProfit");
  const [logoUrl, setLogoUrl] = useState("");
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Settings: pathname.startsWith('/admin/settings'),
    News: pathname.startsWith('/admin/news')
  });

  const toggleSubmenu = (name: string, e?: React.MouseEvent) => {
    const target = e ? (e.currentTarget as HTMLElement) : null;

    setExpandedMenus(prev => {
      const isExpanding = !prev[name];
      if (isExpanding && target) {
        setTimeout(() => {
          const submenu = target.nextElementSibling as HTMLElement;
          if (submenu) {
            submenu.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          } else {
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 150);
      }
      return { ...prev, [name]: isExpanding };
    });
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.siteName) setSiteName(data.siteName);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    let unsubChats: (() => void) | undefined;
    let unsubAlerts: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);

      if (user) {
        if (unsubChats) unsubChats();
        if (unsubAlerts) unsubAlerts();

        const qChats = query(collection(db, "chat_sessions"), where("unreadByAdmin", "==", true));
        unsubChats = onSnapshot(qChats, (snapshot) => {
          setUnreadChatCount(snapshot.size);
        });
        
        const qAlerts = query(collection(db, "admin_alerts"), where("read", "==", false));
        unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
          setUnreadAlertsCount(snapshot.size);
        });
      } else {
        if (unsubChats) unsubChats();
        if (unsubAlerts) unsubAlerts();
      }
    });
    return () => {
      unsubscribe();
      if (unsubChats) unsubChats();
      if (unsubAlerts) unsubAlerts();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setLoginError("Invalid Password");
      } else if (error.code === 'auth/user-not-found') {
        setLoginError("Account Doesn't Exist");
      } else if (error.code === 'auth/invalid-credential') {
        setLoginError("Invalid Password or Account Doesn't Exist");
      } else {
        setLoginError(error.message || "Invalid credentials.");
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <Loader text="Loading admin portal..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <h2>Admin Access</h2>
          <p style={{ color: 'var(--text-muted)' }}>Secure login required.</p>
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.inputField} />
            </div>
            <div className={styles.inputGroup}>
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={styles.inputField} />
            </div>
            {loginError && <div style={{ color: "red", fontSize: '0.9rem' }}>{loginError}</div>}
            <button type="submit" className={styles.submitBtn}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Traffic Stats", href: "/admin/stats", icon: TrendingUp },
    { name: "Revenue", href: "/admin/revenue", icon: TrendingUp },
    { name: "Manage Services", href: "/admin/services", icon: Briefcase },
    {
      name: "News",
      icon: Newspaper,
      subItems: [
        { name: "Add New", href: "/admin/news/add" },
        { name: "Published News", href: "/admin/news" },
        { name: "Categories", href: "/admin/news/categories" },
        { name: "Authors", href: "/admin/news/authors" }
      ]
    },
    { name: "IPOs", href: "/admin/ipos", icon: TrendingUp },
    { name: "Tools", href: "/admin/tools", icon: Calculator },
    { name: "Public Menu", href: "/admin/menu", icon: MenuSquare },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Pages", href: "/admin/pages", icon: FileText },
    {
      name: "Inquiries",
      icon: MessageSquare,
      subItems: [
        { name: "Contact Forms", href: "/admin/inquiries" },
        { name: "Expert Help (Leads)", href: "/admin/expert-help" }
      ]
    },
    { name: "Chat Support", href: "/admin/chat", icon: MessageSquare },
    { name: "Feedback", href: "/admin/feedback", icon: MessageCircleQuestion },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
    { name: "Mobile App", href: "/admin/mobile", icon: Smartphone },
    {
      name: "Settings",
      icon: Settings,
      subItems: [
        { name: "Website Config", href: "/admin/settings/website-config" },
        { name: "Home Page Settings", href: "/admin/settings/home-page" },
        { name: "Auth & Registration", href: "/admin/settings/auth" },
        { name: "AI Settings", href: "/admin/settings/ai" },
        { name: "Public Pages SEO", href: "/admin/settings/seo" },
        { name: "Ads & Custom Code", href: "/admin/settings/ads" },
        { name: "Cache (Redis)", href: "/admin/settings/cache" },
        { name: "Header & Footer", href: "/admin/settings/header-footer" },
        { name: "Payment Gateways", href: "/admin/settings/payment-gateways" },
        { name: "Storage Config", href: "/admin/settings/storage" },
        { name: "Database Settings", href: "/admin/settings/database" }
      ]
    },
  ];

  return (
    <div className={styles.adminContainer} data-theme="dark">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
          ) : (
            <TrendingUp className={styles.logoIcon} size={28} />
          )}
          <h2 className={styles.sidebarTitle}>{siteName}</h2>
          <button
            className={styles.closeSidebarBtn}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.subItems) {
              const isExpanded = expandedMenus[item.name];
              const isAnyChildActive = item.subItems.some(sub => pathname.startsWith(sub.href));

              return (
                <div key={item.name}>
                  <button
                    onClick={(e) => toggleSubmenu(item.name, e)}
                    className={`${styles.navLink} ${isAnyChildActive && !isExpanded ? styles.active : ""}`}
                    style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', display: 'flex', alignItems: 'center' }}
                  >
                    <Icon className={styles.navIcon} />
                    {item.name}
                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className={styles.submenu}>
                      {item.subItems.map(sub => (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className={`${styles.submenuLink} ${pathname === sub.href ? styles.submenuLinkActive : ""}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href) && item.name !== 'Settings');
            return (
              <Link
                key={item.name}
                href={item.href!}
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                style={{ position: 'relative' }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className={styles.navIcon} />
                {item.name}
                {item.name === "Chat Support" && unreadChatCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    right: '1rem',
                    background: '#e53e3e',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 700
                  }}>
                    {unreadChatCount}
                  </span>
                )}
                {item.name === "Notifications" && unreadAlertsCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    right: '1rem',
                    background: '#e53e3e',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 700
                  }}>
                    {unreadAlertsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <div className={styles.topbar}>
          <div className={styles.mobileHeaderLeft}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <span className={styles.mobileSiteName}>{siteName} Admin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto' }}>
            <Link href="/admin/notifications" style={{ position: 'relative', display: 'flex', alignItems: 'center', color: 'var(--text-color)' }}>
              <Bell size={20} />
              {unreadAlertsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: '#e53e3e',
                  color: 'white',
                  fontSize: '0.65rem',
                  padding: '2px 5px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {unreadAlertsCount}
                </span>
              )}
            </Link>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <LogOut size={16} /> <span className={styles.logoutText}>Logout</span>
            </button>
          </div>
        </div>
        <div className={styles.pageContent}>
          {children}
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          &copy; {new Date().getFullYear()} {siteName}. All rights reserved. Admin Dashboard.
        </footer>
      </main>
    </div>
  );
}
