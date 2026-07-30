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
  const [isOptimizing, setIsOptimizing] = useState(false);
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
          const data = docSnap.data() as IPOData;
          if (!data.valuationFields && data.valuation) {
            data.valuationFields = [
              { id: 'eps', label: 'EPS', value: data.valuation.eps?.toString() || '' },
              { id: 'pe', label: 'P/E Ratio', value: data.valuation.pe?.toString() || '' },
              { id: 'industryPe', label: 'Industry P/E', value: data.valuation.industryPe?.toString() || '' },
              { id: 'marketCap', label: 'Market Cap (Cr)', value: data.valuation.marketCap?.toString() || '' },
              { id: 'ronw', label: 'RONW (%)', value: data.valuation.ronw?.toString() || '' },
              { id: 'nav', label: 'NAV', value: data.valuation.nav?.toString() || '' }
            ];
          }
          if (!data.financialTable) {
            data.financialTable = {
              columns: [
                { id: 'year', label: 'Year' },
                { id: 'revenue', label: 'Revenue (Cr)' },
                { id: 'expense', label: 'Expense (Cr)' },
                { id: 'profit', label: 'Profit (Cr)' },
                { id: 'assets', label: 'Assets (Cr)' },
                { id: 'networth', label: 'Net Worth (Cr)' }
              ],
              rows: (data.financials || []).map(fy => ({
                id: `row_${Date.now()}_${Math.random()}`,
                values: {
                  year: fy.year || '',
                  revenue: fy.revenue?.toString() || '0',
                  expense: fy.expense?.toString() || '0',
                  profit: fy.profit?.toString() || '0',
                  assets: fy.assets?.toString() || '0',
                  networth: fy.netWorth?.toString() || '0'
                }
              }))
            };
          }
          if (!data.timelineFields && data.timeline) {
            data.timelineFields = [
              { id: 'openDate', label: 'Open Date', value: data.timeline.openDate || '' },
              { id: 'closeDate', label: 'Close Date', value: data.timeline.closeDate || '' },
              { id: 'basisOfAllotment', label: 'Basis of Allotment', value: data.timeline.basisOfAllotment || '' },
              { id: 'initiationOfRefunds', label: 'Initiation of Refunds', value: data.timeline.initiationOfRefunds || '' },
              { id: 'creditOfShares', label: 'Credit of Shares', value: data.timeline.creditOfShares || '' },
              { id: 'listingDate', label: 'Listing Date', value: data.timeline.listingDate || '' }
            ];
          }
          if (!data.issueDetailsFields) {
            data.issueDetailsFields = [
              { id: 'priceBandLow', label: 'Price Band Low', value: data.priceBandLow?.toString() || '' },
              { id: 'priceBandHigh', label: 'Price Band High', value: data.priceBandHigh?.toString() || '' },
              { id: 'faceValue', label: 'Face Value', value: data.faceValue?.toString() || '' },
              { id: 'lotSize', label: 'Lot Size', value: data.lotSize?.toString() || '' },
              { id: 'issueSize', label: 'Issue Size (Cr)', value: data.issueSize?.toString() || '' },
              { id: 'listedPrice', label: 'Listed Price (₹)', value: data.listedPrice?.toString() || '' }
            ];
          }
          if (!data.subscriptionFields) {
            data.subscriptionFields = [
              { id: 'qib', label: 'QIB Sub', value: data.subscriptionStatus?.qib?.toString() || '0' },
              { id: 'nii', label: 'NII Sub', value: data.subscriptionStatus?.nii?.toString() || '0' },
              { id: 'retail', label: 'Retail Sub', value: data.subscriptionStatus?.retail?.toString() || '0' },
              { id: 'total', label: 'Total Sub', value: data.subscriptionStatus?.total?.toString() || '0' }
            ];
          }
          if (!data.quotaFields) {
            data.quotaFields = [
              { id: 'qibQuota', label: 'QIB Quota (%)', value: data.quota?.qib?.toString() || '50' },
              { id: 'niiQuota', label: 'NII Quota (%)', value: data.quota?.nii?.toString() || '15' },
              { id: 'retailQuota', label: 'Retail Quota (%)', value: data.quota?.retail?.toString() || '35' }
            ];
          }
          setFormData(data);
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

  const handleOptimizeSEO = async () => {
    if (!formData || !formData.description) {
      alert("Please add some description about the company first to generate SEO.");
      return;
    }
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/ai/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.name, content: formData.description, type: "IPO listing" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate SEO");

      setFormData(prev => ({
        ...prev!,
        metaTitle: data.metaTitle || prev!.metaTitle,
        metaDescription: data.metaDescription || prev!.metaDescription,
        seoKeywords: data.seoKeywords || prev!.seoKeywords,
        description: data.optimizedContent || prev!.description
      }));

      alert("AI successfully optimized the SEO and injected contextual links!");
    } catch (error: any) {
      console.error(error);
      alert("SEO Optimization failed: " + error.message);
    } finally {
      setIsOptimizing(false);
    }
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

  const addFinancialColumn = () => {
    if (!formData) return;
    const newColId = `col_${Date.now()}`;
    setFormData(prev => ({
      ...prev!,
      financialTable: {
        columns: [...(prev!.financialTable?.columns || []), { id: newColId, label: 'New Column' }],
        rows: prev!.financialTable?.rows || []
      }
    }));
  };

  const updateFinancialColumn = (index: number, label: string) => {
    if (!formData) return;
    const newCols = [...(formData.financialTable?.columns || [])];
    newCols[index] = { ...newCols[index], label };
    setFormData(prev => ({
      ...prev!,
      financialTable: { ...prev!.financialTable!, columns: newCols }
    }));
  };

  const removeFinancialColumn = (index: number) => {
    if (!formData) return;
    const colToRemove = formData.financialTable?.columns[index];
    if (!colToRemove) return;
    const newCols = formData.financialTable!.columns.filter((_, i) => i !== index);
    const newRows = (formData.financialTable?.rows || []).map(r => {
      const newVals = { ...r.values };
      delete newVals[colToRemove.id];
      return { ...r, values: newVals };
    });
    setFormData(prev => ({
      ...prev!,
      financialTable: { columns: newCols, rows: newRows }
    }));
  };

  const addFinancialRow = () => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      financialTable: {
        columns: prev!.financialTable?.columns || [],
        rows: [...(prev!.financialTable?.rows || []), { id: `row_${Date.now()}`, values: {} }]
      }
    }));
  };

  const updateFinancialCell = (rowIdx: number, colId: string, value: string) => {
    if (!formData) return;
    const newRows = [...(formData.financialTable?.rows || [])];
    newRows[rowIdx] = {
      ...newRows[rowIdx],
      values: { ...newRows[rowIdx].values, [colId]: value }
    };
    setFormData(prev => ({
      ...prev!,
      financialTable: { ...prev!.financialTable!, rows: newRows }
    }));
  };

  const removeFinancialRow = (rowIdx: number) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      financialTable: {
        columns: prev!.financialTable?.columns || [],
        rows: (prev!.financialTable?.rows || []).filter((_, i) => i !== rowIdx)
      }
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

  const addValuationField = () => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      valuationFields: [...(prev!.valuationFields || []), { id: `val_${Date.now()}`, label: '', value: '' }]
    }));
  };

  const updateValuationField = (index: number, key: 'label' | 'value', value: string) => {
    if (!formData) return;
    const newFields = [...(formData.valuationFields || [])];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData(prev => ({ ...prev!, valuationFields: newFields }));
  };

  const removeValuationField = (index: number) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      valuationFields: (prev!.valuationFields || []).filter((_, i) => i !== index)
    }));
  };

  const addTimelineField = () => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      timelineFields: [...(prev!.timelineFields || []), { id: `tl_${Date.now()}`, label: 'New Event', value: '' }]
    }));
  };

  const updateTimelineField = (index: number, key: 'label' | 'value', value: string) => {
    if (!formData) return;
    const newFields = [...(formData.timelineFields || [])];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData(prev => ({ ...prev!, timelineFields: newFields }));
  };

  const removeTimelineField = (index: number) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      timelineFields: (prev!.timelineFields || []).filter((_, i) => i !== index)
    }));
  };

  const addIssueDetailField = () => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      issueDetailsFields: [...(prev!.issueDetailsFields || []), { id: `id_${Date.now()}`, label: 'New Field', value: '' }]
    }));
  };

  const updateIssueDetailField = (index: number, key: 'label' | 'value', value: string) => {
    if (!formData) return;
    const newFields = [...(formData.issueDetailsFields || [])];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData(prev => ({ ...prev!, issueDetailsFields: newFields }));
  };

  const removeIssueDetailField = (index: number) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      issueDetailsFields: (prev!.issueDetailsFields || []).filter((_, i) => i !== index)
    }));
  };

  const addSubscriptionField = () => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      subscriptionFields: [...(prev!.subscriptionFields || []), { id: `sub_${Date.now()}`, label: 'New Field', value: '' }]
    }));
  };

  const updateSubscriptionField = (index: number, key: 'label' | 'value', value: string) => {
    if (!formData) return;
    const newFields = [...(formData.subscriptionFields || [])];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData(prev => ({ ...prev!, subscriptionFields: newFields }));
  };

  const removeSubscriptionField = (index: number) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      subscriptionFields: (prev!.subscriptionFields || []).filter((_, i) => i !== index)
    }));
  };

  const addQuotaField = () => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      quotaFields: [...(prev!.quotaFields || []), { id: `q_${Date.now()}`, label: 'New Quota', value: '' }]
    }));
  };

  const updateQuotaField = (index: number, key: 'label' | 'value', value: string) => {
    if (!formData) return;
    const newFields = [...(formData.quotaFields || [])];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData(prev => ({ ...prev!, quotaFields: newFields }));
  };

  const removeQuotaField = (index: number) => {
    if (!formData) return;
    setFormData(prev => ({
      ...prev!,
      quotaFields: (prev!.quotaFields || []).filter((_, i) => i !== index)
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
          <button type="button" onClick={handleAddCustomTab} style={{...getTabStyle('new'), color: 'var(--icon-color)', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                    <label style={{ marginBottom: 0 }}>Custom SEO Meta Title (Optional)</label>
                    <button 
                      type="button" 
                      onClick={handleOptimizeSEO} 
                      disabled={isOptimizing || !formData.description}
                      style={{ 
                        background: 'linear-gradient(135deg, #a855f7, #7e22ce)', 
                        border: 'none', 
                        color: 'white', 
                        padding: '0.4rem 0.8rem', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {isOptimizing ? "Optimizing..." : "✨ AI Optimize SEO & Links"}
                    </button>
                  </div>
                  <input name="metaTitle" value={formData.metaTitle || ''} onChange={handleChange} placeholder="Custom SEO Title" className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Custom SEO Meta Description (Optional)</label>
                  <textarea name="metaDescription" value={formData.metaDescription || ''} onChange={handleChange} placeholder="Custom SEO Description..." rows={3} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>SEO Keywords (Comma-separated)</label>
                  <input 
                    name="seoKeywords"
                    value={formData.seoKeywords || ''} 
                    onChange={handleChange} 
                    placeholder="e.g. IPO listing, share price" 
                    className={styles.inputField} 
                  />
                </div>
                <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                  <label>Custom Schema (JSON-LD) (Optional)</label>
                  <textarea 
                    name="customSchema"
                    rows={4} 
                    value={formData.customSchema || ''} 
                    onChange={handleChange} 
                    placeholder='{"@context": "https://schema.org", "@type": "FinancialProduct", ...}' 
                    className={styles.inputField} 
                    style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                  />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-color)' }}>Timeline Events</h3>
                <button type="button" onClick={addTimelineField} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Plus size={14} /> Add Event
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {(formData.timelineFields || []).map((field, index) => (
                  <div key={field.id} className={styles.inputGroup} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={field.label} 
                        onChange={(e) => updateTimelineField(index, 'label', e.target.value)} 
                        placeholder="Event Name (e.g. Open Date)"
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontWeight: 'bold', fontSize: '0.9rem', outline: 'none', width: '80%' }}
                      />
                      <button type="button" onClick={() => removeTimelineField(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash size={16} />
                      </button>
                    </div>
                    <input 
                      type="date" 
                      value={field.value} 
                      onChange={(e) => updateTimelineField(index, 'value', e.target.value)} 
                      className={styles.inputField} 
                    />
                  </div>
                ))}
              </div>
              {renderCustomFields('timeline')}
            </div>
          )}

          {activeTab === 'price' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-color)' }}>Issue Details (Price & Size)</h3>
                <button type="button" onClick={addIssueDetailField} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Plus size={14} /> Add Field
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                {(formData.issueDetailsFields || []).map((field, index) => (
                  <div key={field.id} className={styles.inputGroup} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={field.label} 
                        onChange={(e) => updateIssueDetailField(index, 'label', e.target.value)} 
                        placeholder="Field Name (e.g. Price Band High)"
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontWeight: 'bold', fontSize: '0.9rem', outline: 'none', width: '80%' }}
                      />
                      <button type="button" onClick={() => removeIssueDetailField(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash size={16} />
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={field.value} 
                      onChange={(e) => updateIssueDetailField(index, 'value', e.target.value)} 
                      className={styles.inputField} 
                      placeholder="e.g. 192 or 100 Cr"
                    />
                  </div>
                ))}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-color)' }}>Subscription Status (x times)</h3>
                  <button type="button" onClick={addSubscriptionField} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <Plus size={14} /> Add Field
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {(formData.subscriptionFields || []).map((field, index) => (
                    <div key={field.id} className={styles.inputGroup} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <input 
                          type="text" 
                          value={field.label} 
                          onChange={(e) => updateSubscriptionField(index, 'label', e.target.value)} 
                          placeholder="Field Name"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontWeight: 'bold', fontSize: '0.9rem', outline: 'none', width: '80%' }}
                        />
                        <button type="button" onClick={() => removeSubscriptionField(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash size={16} />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={field.value} 
                        onChange={(e) => updateSubscriptionField(index, 'value', e.target.value)} 
                        className={styles.inputField} 
                        placeholder="e.g. 1.25"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles.sectionCard} style={{ padding: '1.5rem', background: 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-color)' }}>Quota (%)</h3>
                  <button type="button" onClick={addQuotaField} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <Plus size={14} /> Add Field
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {(formData.quotaFields || []).map((field, index) => (
                    <div key={field.id} className={styles.inputGroup} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <input 
                          type="text" 
                          value={field.label} 
                          onChange={(e) => updateQuotaField(index, 'label', e.target.value)} 
                          placeholder="Field Name"
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-color)', fontWeight: 'bold', fontSize: '0.9rem', outline: 'none', width: '80%' }}
                        />
                        <button type="button" onClick={() => removeQuotaField(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash size={16} />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={field.value} 
                        onChange={(e) => updateQuotaField(index, 'value', e.target.value)} 
                        className={styles.inputField} 
                        placeholder="e.g. 50"
                      />
                    </div>
                  ))}
                </div>
              </div>
              {renderCustomFields('subscription')}
            </div>
          )}

          {activeTab === 'financials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className={styles.sectionCard} style={{ padding: '1.5rem', background: 'transparent' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', margin: '0 0 1rem 0' }}>Valuation Metrics</h3>
                {formData.valuationFields?.map((field, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Label</label>
                      <input value={field.label} onChange={(e) => updateValuationField(idx, 'label', e.target.value)} className={styles.inputField} placeholder="e.g. EPS" />
                    </div>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Value</label>
                      <input value={field.value} onChange={(e) => updateValuationField(idx, 'value', e.target.value)} className={styles.inputField} placeholder="Value" />
                    </div>
                    <button type="button" onClick={() => removeValuationField(idx)} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', padding: '0.75rem', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addValuationField} style={{ background: 'none', border: '1px dashed var(--border-color)', padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', width: '100%' }}>
                  <Plus size={18} /> Add Valuation Field
                </button>
              </div>

              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', margin: '0' }}>Financial Records Columns</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {formData.financialTable?.columns.map((col, idx) => (
                  <div key={col.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                    <input 
                      value={col.label} 
                      onChange={(e) => updateFinancialColumn(idx, e.target.value)}
                      style={{ border: 'none', background: 'transparent', padding: '0.5rem', color: 'var(--text-color)', width: '120px' }}
                    />
                    <button type="button" onClick={() => removeFinancialColumn(idx)} style={{ background: 'none', border: 'none', borderLeft: '1px solid var(--border-color)', color: '#ef4444', padding: '0.5rem', cursor: 'pointer' }}><Trash size={14}/></button>
                  </div>
                ))}
                <button type="button" onClick={addFinancialColumn} style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--icon-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Plus size={14} /> Add Column
                </button>
              </div>

              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', margin: '0' }}>Financial Records Data</h3>
              {formData.financialTable?.rows.map((row, rowIdx) => (
                <div key={row.id} style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', background: 'var(--bg-secondary)', position: 'relative', marginBottom: '1rem' }}>
                  <button type="button" onClick={() => removeFinancialRow(rowIdx)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash size={16} /></button>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                    {formData.financialTable?.columns.map(col => (
                      <div key={col.id} className={styles.inputGroup}>
                        <label style={{fontSize: '0.8rem'}}>{col.label}</label>
                        <input 
                          value={row.values[col.id] || ''} 
                          onChange={(e) => updateFinancialCell(rowIdx, col.id, e.target.value)} 
                          className={styles.inputField} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addFinancialRow} style={{ background: 'none', border: '1px dashed var(--border-color)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', width: '100%' }}>
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
