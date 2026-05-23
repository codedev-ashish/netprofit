"use client";

import { useEffect, useState } from "react";
import styles from "./layout.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { 
  LayoutDashboard, 
  Briefcase, 
  Newspaper, 
  MenuSquare, 
  FileText, 
  Users, 
  Bell, 
  Smartphone, 
  Settings,
  LogOut,
  TrendingUp
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

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Settings: pathname.startsWith('/admin/settings')
  });

  const toggleSubmenu = (name: string) => {
    setExpandedMenus(prev => ({ ...prev, [name]: !prev[name] }));
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
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
    return <div className={styles.loaderContainer}>Loading admin portal...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <h2>Admin Access</h2>
          <p style={{color: 'var(--text-muted)'}}>Secure login required.</p>
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
    { name: "Manage Services", href: "/admin/services", icon: Briefcase },
    { name: "News", href: "/admin/news", icon: Newspaper },
    { name: "Public Menu", href: "/admin/menu", icon: MenuSquare },
    { name: "Pages", href: "/admin/pages", icon: FileText },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "IPOs", href: "/admin/ipos", icon: TrendingUp },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
    { name: "Mobile App", href: "/admin/mobile", icon: Smartphone },
    { 
      name: "Settings", 
      icon: Settings,
      subItems: [
        { name: "Website Config", href: "/admin/settings/website-config" },
        { name: "Ads & Custom Code", href: "/admin/settings/ads" },
        { name: "Cache (Redis)", href: "/admin/settings/cache" },
        { name: "Header & Footer", href: "/admin/settings/header-footer" }
      ]
    },
  ];

  return (
    <div className={styles.adminContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
          ) : (
            <TrendingUp className={styles.logoIcon} size={28} />
          )}
          <h2 className={styles.sidebarTitle}>{siteName}</h2>
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
                    onClick={() => toggleSubmenu(item.name)}
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
              >
                <Icon className={styles.navIcon} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <div className={styles.topbar}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={16} /> Logout
          </button>
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
