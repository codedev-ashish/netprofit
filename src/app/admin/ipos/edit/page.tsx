"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../../../../src/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import styles from "../../page.module.css";
import { ArrowLeft, Plus, Trash, ArrowUp, ArrowDown } from "lucide-react";
import { IPOData, IPOType, IPOStatus } from "../types";
import RichTextEditor from "../../../../../src/components/RichTextEditor";

export default function EditIPOForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<IPOData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIPO() {
      if (!id) {
        alert("No IPO ID provided!");
        router.push('/admin/ipos');
        return;
      }
      try {
        const docRef = doc(db, "ipos", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data() as IPOData);
        } else {
          alert("No such IPO document!");
          router.push('/admin/ipos');
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchIPO();
  }, [id, router]);

  const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    const { name, value, type } = e.target;
    setFormData(prev => {
      const newData = { ...prev!, [name]: type === 'number' ? parseFloat(value) || 0 : value };
      if (name === 'name' && (!prev!.slug || prev!.slug === generateSlug(prev!.name))) {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
  };

  const handleAddCustomTab = () => {
    const tabName = prompt("Enter new tab name:");
    if (!tabName) return;
    const tabId = generateSlug(tabName);
    
    if (formData?.customTabs?.some(t => t.id === tabId)) {
      alert("Tab already exists!");
      return;
    }
    
    setFormData(prev => ({
      ...prev!,
      customTabs: [...(prev!.customTabs || []), { id: tabId, name: tabName, fields: [] }]
    }));
    setActiveTab(tabId);
  };

  const handleAddCustomField = (tabId: string) => {
    const fieldName = prompt("Enter field name:");
    if (!fieldName) return;
    const fieldId = generateSlug(fieldName);
    
    setFormData(prev => {
      const tabs = [...(prev!.customTabs || [])];
      let tabIndex = tabs.findIndex(t => t.id === tabId);
      
      if (tabIndex === -1) {
        const standardNames: Record<string, string> = {
          'general': 'General', 'timeline': 'Timeline', 'price': 'Price & Size', 'subscription': 'Subscription & Quota', 'financials': 'Financials', 'affiliate': 'Affiliate'
        };
        tabs.push({ id: tabId, name: standardNames[tabId] || tabId, fields: [] });
        tabIndex = tabs.length - 1;
      }
      
      tabs[tabIndex] = {
        ...tabs[tabIndex],
        fields: [...tabs[tabIndex].fields, { id: fieldId, name: fieldName, value: '' }]
      };
      
      return { ...prev!, customTabs: tabs };
    });
  };

  const handleCustomFieldUpdate = (tabId: string, fieldId: string, key: 'value' | 'type', val: string) => {
    setFormData(prev => {
      const tabs = [...(prev!.customTabs || [])];
      const tabIndex = tabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return prev;
      
      const newFields = tabs[tabIndex].fields.map(f => 
        f.id === fieldId ? { ...f, [key]: val } : f
      );
      
      tabs[tabIndex] = { ...tabs[tabIndex], fields: newFields };
      return { ...prev!, customTabs: tabs };
    });
  };
  
  const handleRemoveCustomField = (tabId: string, fieldId: string) => {
    setFormData(prev => {
      const tabs = [...(prev!.customTabs || [])];
      const tabIndex = tabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return prev;
      
      const newFields = tabs[tabIndex].fields.filter(f => f.id !== fieldId);
      tabs[tabIndex] = { ...tabs[tabIndex], fields: newFields };
      return { ...prev!, customTabs: tabs };
    });
  };
  
  const handleMoveCustomField = (tabId: string, index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const tabs = [...(prev!.customTabs || [])];
      const tabIndex = tabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return prev;
      
      const newFields = [...tabs[tabIndex].fields];
      if (direction === 'up' && index > 0) {
        [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      } else if (direction === 'down' && index < newFields.length - 1) {
        [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      }
      
      tabs[tabIndex] = { ...tabs[tabIndex], fields: newFields };
      return { ...prev!, customTabs: tabs };
    });
  };

  const handleMoveCustomTab = (tabId: string, direction: 'left' | 'right') => {
    setFormData(prev => {
      const tabs = [...(prev!.customTabs || [])];
      const customOnlyIndexes: number[] = [];
      for (let i = 0; i < tabs.length; i++) {
        if (!['general', 'timeline', 'price', 'subscription', 'financials', 'affiliate'].includes(tabs[i].id)) {
          customOnlyIndexes.push(i);
        }
      }
      const myIdxInCustom = customOnlyIndexes.findIndex(idx => tabs[idx].id === tabId);
      if (myIdxInCustom === -1) return prev;
      
      if (direction === 'left' && myIdxInCustom > 0) {
        const targetIdx = customOnlyIndexes[myIdxInCustom - 1];
        const myIdx = customOnlyIndexes[myIdxInCustom];
        [tabs[targetIdx], tabs[myIdx]] = [tabs[myIdx], tabs[targetIdx]];
      } else if (direction === 'right' && myIdxInCustom < customOnlyIndexes.length - 1) {
        const targetIdx = customOnlyIndexes[myIdxInCustom + 1];
        const myIdx = customOnlyIndexes[myIdxInCustom];
        [tabs[targetIdx], tabs[myIdx]] = [tabs[myIdx], tabs[targetIdx]];
      }
      return { ...prev!, customTabs: tabs };
    });
  };

  const renderCustomFields = (tabId: string) => {
    const tab = formData?.customTabs?.find(t => t.id === tabId);
    return (
      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', margin: 0 }}>Custom Fields</h3>
          <button type="button" onClick={() => handleAddCustomField(tabId)} style={{ background: 'none', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={14} /> Add Field
          </button>
        </div>
        {tab?.fields && tab.fields.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {tab.fields.map((field, index) => (
              <div key={field.id} className={styles.inputGroup} style={{ gridColumn: field.type === 'text' ? '1 / -1' : 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ margin: 0 }}>{field.name}</label>
                  <select 
                    value={field.type || 'text'} 
                    onChange={(e) => handleCustomFieldUpdate(tabId, field.id, 'type', e.target.value)}
                    style={{ fontSize: '0.75rem', padding: '0.1rem 0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }}
                  >
                    <option value="text">Text (Rich)</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="url">URL</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {(!field.type || field.type === 'text') ? (
                      <RichTextEditor value={field.value} onChange={(val) => handleCustomFieldUpdate(tabId, field.id, 'value', val)} />
                    ) : (
                      <input type={field.type} value={field.value} onChange={(e) => handleCustomFieldUpdate(tabId, field.id, 'value', e.target.value)} className={styles.inputField} />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex' }}>
                      <button type="button" onClick={() => handleMoveCustomField(tabId, index, 'up')} disabled={index === 0} style={{ background: 'none', border: 'none', color: index === 0 ? 'var(--border-color)' : 'var(--text-color)', cursor: index === 0 ? 'default' : 'pointer', padding: '0.25rem' }}>
                        <ArrowUp size={16} />
                      </button>
                      <button type="button" onClick={() => handleMoveCustomField(tabId, index, 'down')} disabled={index === tab.fields.length - 1} style={{ background: 'none', border: 'none', color: index === tab.fields.length - 1 ? 'var(--border-color)' : 'var(--text-color)', cursor: index === tab.fields.length - 1 ? 'default' : 'pointer', padding: '0.25rem' }}>
                        <ArrowDown size={16} />
                      </button>
                    </div>
                    <button type="button" onClick={() => handleRemoveCustomField(tabId, field.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', display: 'flex', justifyContent: 'center' }}>
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No custom fields added yet.</p>
        )}
      </div>
    );
  };

  const handleNestedChange = (parent: keyof IPOData, field: string, value: any) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      [parent]: {
        ...(prev![parent] as any),
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !id) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, "ipos", id);
      await updateDoc(docRef, { 
        ...formData, 
        updatedAt: serverTimestamp() 
      });
      alert("IPO updated successfully!");
      router.push('/admin/ipos');
    } catch (error) {
      console.error("Error updating IPO: ", error);
      alert("Failed to update IPO.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFinancialYear = () => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      financials: [...prev!.financials, { year: '', revenue: 0, expense: 0, profit: 0, assets: 0, netWorth: 0, reserves: 0, debt: 0 }]
    }));
  };

  const updateFinancialYear = (index: number, field: string, value: any) => {
    if (!formData) return;
    const newFinancials = [...formData.financials];
    newFinancials[index] = { ...newFinancials[index], [field]: value };
    setFormData(prev => ({ ...prev!, financials: newFinancials }));
  };

  const removeFinancialYear = (index: number) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      financials: prev!.financials.filter((_, i) => i !== index)
    }));
  };

  const addGmpRecord = () => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      gmpHistory: [...(prev!.gmpHistory || []), { date: '', price: 0, change: 0 }]
    }));
  };

  const updateGmpRecord = (index: number, field: string, value: any) => {
    if (!formData) return;
    const newGmp = [...(formData.gmpHistory || [])];
    newGmp[index] = { ...newGmp[index], [field]: value };
    setFormData(prev => ({ ...prev!, gmpHistory: newGmp }));
  };

  const removeGmpRecord = (index: number) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      gmpHistory: (prev!.gmpHistory || []).filter((_, i) => i !== index)
    }));
  };

  const getTabStyle = (tab: string) => ({
    padding: '0.75rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    borderBottom: activeTab === tab ? '3px solid var(--primary-color)' : '3px solid transparent',
    background: activeTab === tab ? 'var(--card-bg)' : 'transparent',
    color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-muted)',
    transition: 'all 0.2s ease',
    outline: 'none',
    borderRadius: '8px 8px 0 0'
  });

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!formData) return null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button type="button" onClick={() => router.push('/admin/ipos')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Edit IPO</h1>
      </div>

      <form onSubmit={handleSubmit} className={`premium-card`} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '0.5rem 1rem 0 1rem', gap: '0.5rem', overflowX: 'auto' }}>
          <button type="button" onClick={() => setActiveTab('general')} style={getTabStyle('general')}>General</button>
          <button type="button" onClick={() => setActiveTab('timeline')} style={getTabStyle('timeline')}>Timeline</button>
          <button type="button" onClick={() => setActiveTab('price')} style={getTabStyle('price')}>Price & Size</button>
          <button type="button" onClick={() => setActiveTab('subscription')} style={getTabStyle('subscription')}>Subscription & Quota</button>
          <button type="button" onClick={() => setActiveTab('financials')} style={getTabStyle('financials')}>Financials</button>
          <button type="button" onClick={() => setActiveTab('affiliate')} style={getTabStyle('affiliate')}>Affiliate</button>
          {formData.customTabs?.filter(t => !['general', 'timeline', 'price', 'subscription', 'financials', 'affiliate'].includes(t.id)).map((tab, idx, arr) => (
            <div key={tab.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button type="button" onClick={() => setActiveTab(tab.id)} style={getTabStyle(tab.id)}>{tab.name}</button>
              {activeTab === tab.id && (
                <div style={{ display: 'flex', gap: '0.25rem', padding: '0 0.5rem', background: 'var(--card-bg)', borderBottom: '3px solid var(--primary-color)' }}>
                  <button type="button" onClick={() => handleMoveCustomTab(tab.id, 'left')} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'var(--border-color)' : 'var(--text-color)' }}><ArrowLeft size={14}/></button>
                  <button type="button" onClick={() => handleMoveCustomTab(tab.id, 'right')} disabled={idx === arr.length - 1} style={{ background: 'none', border: 'none', cursor: idx === arr.length - 1 ? 'default' : 'pointer', color: idx === arr.length - 1 ? 'var(--border-color)' : 'var(--text-color)' }}><ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }}/></button>
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddCustomTab} style={{...getTabStyle('new'), color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
            <Plus size={16} /> New Tab
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.inputGroup}>
                  <label>Company Name</label>
                  <input required name="name" value={formData.name || ''} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Slug (URL)</label>
                  <input required name="slug" value={formData.slug || ''} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Symbol</label>
                  <input required name="symbol" value={formData.symbol || ''} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>IPO Type</label>
                  <select name="type" value={formData.type || ''} onChange={handleChange} className={styles.inputField}>
                    <option value={IPOType.MAINBOARD}>Mainboard</option>
                    <option value={IPOType.SME}>SME</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Status</label>
                  <select name="status" value={formData.status || ''} onChange={handleChange} className={styles.inputField}>
                    <option value={IPOStatus.UPCOMING}>Upcoming</option>
                    <option value={IPOStatus.OPEN}>Open</option>
                    <option value={IPOStatus.CLOSED}>Closed</option>
                    <option value={IPOStatus.LISTED}>Listed</option>
                  </select>
                </div>
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Description (About Company)</label>
                <RichTextEditor value={formData.description || ''} onChange={(val) => setFormData(prev => ({ ...prev!, description: val }))} />
              </div>
              {renderCustomFields('general')}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.inputGroup}>
                  <label>Open Date</label>
                  <input type="date" value={formData.timeline?.openDate || ''} onChange={(e) => handleNestedChange('timeline', 'openDate', e.target.value)} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Close Date</label>
                  <input type="date" value={formData.timeline?.closeDate || ''} onChange={(e) => handleNestedChange('timeline', 'closeDate', e.target.value)} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Basis of Allotment</label>
                  <input type="date" value={formData.timeline?.basisOfAllotment || ''} onChange={(e) => handleNestedChange('timeline', 'basisOfAllotment', e.target.value)} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Initiation of Refunds</label>
                  <input type="date" value={formData.timeline?.initiationOfRefunds || ''} onChange={(e) => handleNestedChange('timeline', 'initiationOfRefunds', e.target.value)} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Credit of Shares</label>
                  <input type="date" value={formData.timeline?.creditOfShares || ''} onChange={(e) => handleNestedChange('timeline', 'creditOfShares', e.target.value)} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Listing Date</label>
                  <input type="date" value={formData.timeline?.listingDate || ''} onChange={(e) => handleNestedChange('timeline', 'listingDate', e.target.value)} className={styles.inputField} />
                </div>
              </div>
              {renderCustomFields('timeline')}
            </div>
          )}

          {activeTab === 'price' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className={styles.inputGroup}>
                  <label>Price Band Low</label>
                  <input type="number" name="priceBandLow" value={formData.priceBandLow || ''} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Price Band High</label>
                  <input type="number" name="priceBandHigh" value={formData.priceBandHigh || ''} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Face Value</label>
                  <input type="number" name="faceValue" value={formData.faceValue || ''} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Lot Size</label>
                  <input type="number" name="lotSize" value={formData.lotSize} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Issue Size (Cr)</label>
                  <input type="number" name="issueSize" value={formData.issueSize} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Listed Price (₹)</label>
                  <input type="number" name="listedPrice" value={formData.listedPrice || 0} onChange={handleChange} className={styles.inputField} />
                </div>
              </div>

              <div className={styles.sectionCard} style={{ padding: '1.5rem', background: 'transparent' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', margin: '0 0 1rem 0' }}>Grey Market Premium (GMP) History</h3>
                {formData.gmpHistory?.map((gmp, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Date</label>
                      <input type="date" value={gmp.date} onChange={(e) => updateGmpRecord(idx, 'date', e.target.value)} className={styles.inputField} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Price (₹)</label>
                      <input type="number" step="0.01" value={gmp.price} onChange={(e) => updateGmpRecord(idx, 'price', parseFloat(e.target.value))} className={styles.inputField} />
                    </div>
                    <button type="button" onClick={() => removeGmpRecord(idx)} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', padding: '0.75rem', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addGmpRecord} style={{ background: 'none', border: '1px dashed var(--border-color)', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', width: '100%' }}>
                  <Plus size={18} /> Add GMP Record
                </button>
              </div>

              {renderCustomFields('price')}
            </div>
          )}

          {activeTab === 'subscription' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className={styles.sectionCard} style={{ padding: '1.5rem', background: 'transparent' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', margin: '0 0 1rem 0' }}>Subscription Status (x times)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={styles.inputGroup}>
                    <label>QIB Sub</label>
                    <input type="number" step="0.01" value={formData.subscriptionStatus?.qib || 0} onChange={(e) => handleNestedChange('subscriptionStatus', 'qib', Number(e.target.value))} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>NII Sub</label>
                    <input type="number" step="0.01" value={formData.subscriptionStatus?.nii || 0} onChange={(e) => handleNestedChange('subscriptionStatus', 'nii', Number(e.target.value))} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Retail Sub</label>
                    <input type="number" step="0.01" value={formData.subscriptionStatus?.retail || 0} onChange={(e) => handleNestedChange('subscriptionStatus', 'retail', Number(e.target.value))} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Total Sub</label>
                    <input type="number" step="0.01" value={formData.subscriptionStatus?.total || 0} onChange={(e) => handleNestedChange('subscriptionStatus', 'total', Number(e.target.value))} className={styles.inputField} />
                  </div>
                </div>
              </div>
              
              <div className={styles.sectionCard} style={{ padding: '1.5rem', background: 'transparent' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', margin: '0 0 1rem 0' }}>Quota (%)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={styles.inputGroup}>
                    <label>QIB Quota (%)</label>
                    <input type="number" step="0.01" value={formData.quota?.qib || 0} onChange={(e) => handleNestedChange('quota', 'qib', Number(e.target.value))} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>NII Quota (%)</label>
                    <input type="number" step="0.01" value={formData.quota?.nii || 0} onChange={(e) => handleNestedChange('quota', 'nii', Number(e.target.value))} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Retail Quota (%)</label>
                    <input type="number" step="0.01" value={formData.quota?.retail || 0} onChange={(e) => handleNestedChange('quota', 'retail', Number(e.target.value))} className={styles.inputField} />
                  </div>
                </div>
              </div>
              {renderCustomFields('subscription')}
            </div>
          )}

          {activeTab === 'financials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className={styles.sectionCard} style={{ padding: '1.5rem', background: 'transparent' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', margin: '0 0 1rem 0' }}>Valuation Metrics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div className={styles.inputGroup}>
                    <label>EPS</label>
                    <input type="number" step="0.01" value={formData.valuation?.eps || 0} onChange={(e) => handleNestedChange('valuation', 'eps', Number(e.target.value))} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>P/E Ratio</label>
                    <input type="number" step="0.01" value={formData.valuation?.pe || 0} onChange={(e) => handleNestedChange('valuation', 'pe', Number(e.target.value))} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Industry P/E</label>
                    <input type="number" step="0.01" value={formData.valuation?.industryPe || 0} onChange={(e) => handleNestedChange('valuation', 'industryPe', Number(e.target.value))} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Market Cap (Cr)</label>
                    <input type="number" step="0.01" value={formData.valuation?.marketCap || 0} onChange={(e) => handleNestedChange('valuation', 'marketCap', Number(e.target.value))} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>RONW (%)</label>
                    <input type="number" step="0.01" value={formData.valuation?.ronw || 0} onChange={(e) => handleNestedChange('valuation', 'ronw', Number(e.target.value))} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>NAV</label>
                    <input type="number" step="0.01" value={formData.valuation?.nav || 0} onChange={(e) => handleNestedChange('valuation', 'nav', Number(e.target.value))} className={styles.inputField} />
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', margin: '0' }}>Financial Records</h3>
              {formData.financials?.map((fy, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', background: 'var(--bg-secondary)', position: 'relative' }}>
                  <button type="button" onClick={() => removeFinancialYear(idx)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash size={16} /></button>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Year</label>
                      <input value={fy.year} onChange={(e) => updateFinancialYear(idx, 'year', e.target.value)} className={styles.inputField} placeholder="e.g. FY23" />
                    </div>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Revenue (Cr)</label>
                      <input type="number" step="0.01" value={fy.revenue || 0} onChange={(e) => updateFinancialYear(idx, 'revenue', parseFloat(e.target.value))} className={styles.inputField} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Expense (Cr)</label>
                      <input type="number" step="0.01" value={fy.expense || 0} onChange={(e) => updateFinancialYear(idx, 'expense', parseFloat(e.target.value))} className={styles.inputField} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Profit (Cr)</label>
                      <input type="number" step="0.01" value={fy.profit || 0} onChange={(e) => updateFinancialYear(idx, 'profit', parseFloat(e.target.value))} className={styles.inputField} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Assets (Cr)</label>
                      <input type="number" step="0.01" value={fy.assets || 0} onChange={(e) => updateFinancialYear(idx, 'assets', parseFloat(e.target.value))} className={styles.inputField} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Net Worth (Cr)</label>
                      <input type="number" step="0.01" value={fy.netWorth || 0} onChange={(e) => updateFinancialYear(idx, 'netWorth', parseFloat(e.target.value))} className={styles.inputField} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addFinancialYear} style={{ background: 'none', border: '1px dashed var(--border-color)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
                <Plus size={18} /> Add Financial Year
              </button>
              {renderCustomFields('financials')}
            </div>
          )}

          {activeTab === 'affiliate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className={styles.inputGroup}>
                <label>Affiliate Link (Apply URL)</label>
                <input type="url" name="affiliateLink" value={formData.affiliateLink || ''} onChange={handleChange} className={styles.inputField} placeholder="https://..." />
              </div>
              {renderCustomFields('affiliate')}
            </div>
          )}

          {!['general', 'timeline', 'price', 'financials', 'affiliate'].includes(activeTab) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {renderCustomFields(activeTab)}
            </div>
          )}
        </div>

        <div style={{ padding: '1rem 2rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" onClick={() => router.push('/admin/ipos')} className={styles.submitBtn} style={{ background: '#64748b' }}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update IPO"}
          </button>
        </div>
      </form>
    </div>
  );
}
