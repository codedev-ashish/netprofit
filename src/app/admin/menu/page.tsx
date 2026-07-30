"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc } from "firebase/firestore";
import { Trash2, Edit, Eye, EyeOff } from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  url: string;
  position: string;
  isPublished?: boolean;
  createdAt: any;
}

export default function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [position, setPosition] = useState("header_main");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
      if (editingId) {
        await updateDoc(doc(db, "menu_items", editingId), {
          label,
          url,
          position,
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "menu_items"), {
          label,
          url,
          position,
          isPublished: true,
          createdAt: serverTimestamp()
        });
      }
      setLabel("");
      setUrl("");
      setPosition("header_main");
      fetchMenu();
    } catch (error) {
      console.error("Error saving menu item:", error);
      alert("Failed to save menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setLabel(item.label);
    setUrl(item.url);
    setPosition(item.position || "header_main");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "menu_items", id), {
        isPublished: !currentStatus
      });
      fetchMenu();
    } catch (error) {
      console.error("Error updating publish status:", error);
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
        <h2>{editingId ? "Edit Menu Item" : "Add Menu Item"}</h2>
        {editingId && (
          <button 
            type="button" 
            onClick={() => {
              setEditingId(null);
              setLabel("");
              setUrl("");
              setPosition("header_main");
            }}
            style={{ marginBottom: '1rem', background: 'none', border: 'none', color: 'var(--icon-color)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Cancel Editing
          </button>
        )}
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
            {isSubmitting ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Update Menu Item" : "Add to Menu")}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--text-color)', textDecoration: item.isPublished === false ? 'line-through' : 'none', opacity: item.isPublished === false ? 0.6 : 1 }}>{item.label}</strong> 
                            {item.isPublished === false && <span style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Hidden</span>}
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              {item.url}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button 
                              onClick={() => togglePublish(item.id, item.isPublished !== false)} 
                              style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'color 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#f8fafc'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                              title={item.isPublished !== false ? "Unpublish/Hide" : "Publish/Show"}
                            >
                              {item.isPublished !== false ? <EyeOff size={18}/> : <Eye size={18}/>} 
                              <span style={{ fontSize: '0.9rem' }}>{item.isPublished !== false ? 'Hide' : 'Show'}</span>
                            </button>
                            <button 
                              onClick={() => handleEdit(item)} 
                              style={{ color: 'var(--icon-color)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Edit size={16}/> Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)} 
                              style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Trash2 size={16}/> Delete
                            </button>
                          </div>
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
