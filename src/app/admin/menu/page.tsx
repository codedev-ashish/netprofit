"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { Trash2 } from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  url: string;
  position: string;
  createdAt: any;
}

export default function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [position, setPosition] = useState("header_main");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const q = query(collection(db, "menu_items"), orderBy("createdAt", "asc"));
      const querySnapshot = await getDocs(q);
      const items: MenuItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      setMenuItems(items);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "menu_items"), {
        label,
        url,
        position,
        createdAt: serverTimestamp()
      });
      setLabel("");
      setUrl("");
      setPosition("header_main");
      fetchMenu();
    } catch (error) {
      console.error("Error adding menu item:", error);
      alert("Failed to add menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this link from the menu?")) {
      try {
        await deleteDoc(doc(db, "menu_items", id));
        fetchMenu();
      } catch (error) {
        console.error("Error deleting menu item:", error);
      }
    }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Public Menu Management</h1>
      <p className={styles.pageSubtitle}>Organize the links shown in the website header.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>Add Menu Item</h2>
        <form className={styles.form} onSubmit={handleAdd}>
          <div className={styles.inputGroup}>
            <label>Link Text</label>
            <input 
              type="text" 
              placeholder="e.g. About Us" 
              className={styles.inputField} 
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>URL / Path</label>
            <input 
              type="text" 
              placeholder="e.g. /about" 
              className={styles.inputField} 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Menu Position</label>
            <select 
              className={styles.inputField} 
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
            >
              <option value="header_main">Header Main Menu</option>
              <option value="header_top">Header Top Menu</option>
              <option value="footer_bottom">Bottom Footer Menu</option>
            </select>
          </div>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add to Menu"}
          </button>
        </form>
      </div>

      <div className={`cleartax-card ${styles.managementCard}`} style={{ marginTop: "2rem" }}>
        <h2>Current Menu Items</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
          {menuItems.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No custom menu items. Only default links will show.</p>
          ) : (
            <>
              {['header_main', 'header_top', 'footer_bottom'].map((posGroup) => {
                const groupItems = menuItems.filter(item => item.position === posGroup || (!item.position && posGroup === 'header_main'));
                if (groupItems.length === 0) return null;
                
                const groupTitle = posGroup === 'header_main' ? 'Header Main Menu' : posGroup === 'header_top' ? 'Header Top Menu' : 'Bottom Footer Menu';
                
                return (
                  <div key={posGroup}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      {groupTitle}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {groupItems.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-color)' }}>
                          <div>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--text-color)' }}>{item.label}</strong> 
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              {item.url}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Trash2 size={16}/> Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
