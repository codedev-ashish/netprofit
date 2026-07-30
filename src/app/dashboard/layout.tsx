"use client";

import Loader from "../../components/Loader";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Settings, LogOut, Building2, MessageSquare, Flag, UserCog, Newspaper } from "lucide-react";
import styles from "./layout.module.css";
import { db } from "../../lib/firebase";
import { auth } from "../../lib/firebase-auth";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.isAdmin) {
              router.push("/admin/dashboard");
              return;
            }
            setUser({ id: currentUser.uid, ...data });
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
        setLoading(false);
      } else {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading) {
    return <Loader text="Loading your panel..." />;
  }

  return (
    <div className={styles.dashboardLayout} data-theme="dark">
      <aside className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>User Panel</h2>
        
        <Link 
          href="/dashboard" 
          className={`${styles.navItem} ${pathname === '/dashboard' ? styles.activeNavItem : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        
        <Link 
          href="/user/services" 
          className={`${styles.navItem} ${pathname?.startsWith('/user/services') ? styles.activeNavItem : ''}`}
        >
          <ShoppingBag size={20} />
          <span>Buy Services</span>
        </Link>

        <Link 
          href="/dashboard/manage" 
          className={`${styles.navItem} ${pathname === '/dashboard/manage' ? styles.activeNavItem : ''}`}
        >
          <Settings size={20} />
          <span>Manage Services</span>
        </Link>
        
        <Link 
          href="/dashboard/businesses" 
          className={`${styles.navItem} ${pathname === '/dashboard/businesses' ? styles.activeNavItem : ''}`}
        >
          <Building2 size={20} />
          <span>Businesses</span>
        </Link>

        <Link 
          href="/dashboard/billing" 
          className={`${styles.navItem} ${pathname === '/dashboard/billing' ? styles.activeNavItem : ''}`}
        >
          <ShoppingBag size={20} />
          <span>Billing & Invoices</span>
        </Link>

        <Link 
          href="/dashboard/news" 
          className={`${styles.navItem} ${pathname?.startsWith('/dashboard/news') ? styles.activeNavItem : ''}`}
        >
          <Newspaper size={20} />
          <span>News</span>
        </Link>

        {(!user?.chatDisabled) && (
          <Link 
            href="/dashboard/chat" 
            className={`${styles.navItem} ${pathname === '/dashboard/chat' ? styles.activeNavItem : ''}`}
          >
            <MessageSquare size={20} />
            <span>Chat with Admin</span>
          </Link>
        )}

        <Link 
          href="/dashboard/feedback"  
          className={`${styles.navItem} ${pathname === '/dashboard/feedback' ? styles.activeNavItem : ''}`}
        >
          <Flag size={20} />
          <span>Feedback & Support</span>
        </Link>

        <Link 
          href="/dashboard/settings" 
          className={`${styles.navItem} ${pathname === '/dashboard/settings' ? styles.activeNavItem : ''}`}
        >
          <UserCog size={20} />
          <span>Settings</span>
        </Link>

      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
