"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { Trash2, Plus } from "lucide-react";

export default function AdminNewsCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "news_categories"));
      const catData: any[] = [];
      querySnapshot.forEach((doc) => {
        catData.push({ id: doc.id, ...doc.data() });
      });
      // Sort alphabetically
      catData.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(catData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "news_categories"), { name: newCategoryName, createdAt: serverTimestamp() });
      setNewCategoryName("");
      fetchCategories();
    } catch (e) {
      console.error("Error creating category", e);
      alert("Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCategory = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the category "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "news_categories", id));
        fetchCategories();
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  // Helper to generate a consistent color based on string
  const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>News Categories</h1>
      <p className={styles.pageSubtitle}>Manage categories for your news articles.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>Add New Category</h2>
        <form className={styles.form} onSubmit={handleCreateCategory}>
          <div className={styles.inputGroup} style={{display: 'flex', gap: '1rem', alignItems: 'flex-end'}}>
            <div style={{flex: 1}}>
              <label>Category Name</label>
              <input 
                type="text" 
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)} 
                required 
                className={styles.inputField} 
                placeholder="e.g. Technology"
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting} style={{height: '42px', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <Plus size={16} /> {isSubmitting ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>

      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>Existing Categories</h2>
        {loading ? (
          <p style={{color: '#64748b', marginTop: '1rem'}}>Loading categories...</p>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
            {categories.length === 0 ? <p style={{color: '#64748b'}}>No categories found.</p> : null}
            {categories.map(c => {
              const firstLetter = c.name.charAt(0).toUpperCase();
              const badgeColor = stringToColor(c.name);
              
              return (
                <div key={c.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px'}}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: badgeColor,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.2rem'
                    }}>
                      {firstLetter}
                    </div>
                    <strong style={{fontSize: '1.1rem'}}>{c.name}</strong> 
                  </div>
                  <div style={{display: 'flex', gap: '1rem'}}>
                    <button onClick={() => deleteCategory(c.id, c.name)} style={{color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                      <Trash2 size={16}/> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
