"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../../src/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import styles from "../../page.module.css";
import { ArrowLeft, Plus, Trash, ArrowUp, ArrowDown } from "lucide-react";
import { IPOData, DEFAULT_IPO_TEMPLATE, IPOType, IPOStatus } from "../types";
import RichTextEditor from "../../../../../src/components/RichTextEditor";

export default function CreateIPOForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<IPOData>(DEFAULT_IPO_TEMPLATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [chittorgarhUrl, setChittorgarhUrl] = useState('');
  const [isFetchingData, setIsFetchingData] = useState(false);

  const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  useEffect(() => {
    const getTimelineField = (keyword: string, fallback?: string) => {
      if (formData.timelineFields) {
        const field = formData.timelineFields.find(f => f.label.toLowerCase().includes(keyword.toLowerCase()));
        if (field && field.value) return field.value;
      }
      return fallback;
    };

    const openDateStr = getTimelineField('open', formData.openDate);
    const closeDateStr = getTimelineField('close', formData.closeDate);
    const listingDateStr = getTimelineField('listing', formData.listingDate);

    if (!openDateStr && !closeDateStr && !listingDateStr) return;

    const now = new Date();
    
    const parseDate = (d?: string) => {
      if (!d || d === "TBA") return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const openDate = parseDate(openDateStr);
    const closeDate = parseDate(closeDateStr);
    const listingDate = parseDate(listingDateStr);
    
    if (closeDate) {
      closeDate.setHours(16, 0, 0, 0); 
    }
    
    let calculatedStatus = formData.status;

    if (listingDate && now >= listingDate) {
      calculatedStatus = IPOStatus.LISTED;
    } else if (closeDate && now > closeDate) {
      calculatedStatus = IPOStatus.CLOSED;
    } else if (openDate && now >= openDate) {
      if (!closeDate || now <= closeDate) {
        calculatedStatus = IPOStatus.OPEN;
      }
    } else if (openDate && now < openDate) {
      calculatedStatus = IPOStatus.UPCOMING;
    }

    if (calculatedStatus !== formData.status) {
      setFormData(prev => ({ ...prev, status: calculatedStatus }));
    }
  }, [formData.timelineFields, formData.openDate, formData.closeDate, formData.listingDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value };
      if (name === 'name' && (!prev.slug || prev.slug === generateSlug(prev.name))) {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
  };

  const handleOptimizeSEO = async () => {
    if (!formData.description) {
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
        ...prev,
        metaTitle: data.metaTitle || prev.metaTitle,
        metaDescription: data.metaDescription || prev.metaDescription,
        seoKeywords: data.seoKeywords || prev.seoKeywords,
        description: data.optimizedContent || prev.description
      }));

      alert("AI successfully optimized the SEO and injected contextual links!");
    } catch (error: any) {
      console.error(error);
      alert("SEO Optimization failed: " + error.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFetchChittorgarh = async () => {
    if (!chittorgarhUrl.includes('chittorgarh.com')) {
      alert("Please enter a valid Chittorgarh URL.");
      return;
    }
    setIsFetchingData(true);
    try {
      const res = await fetch("/api/ai/fetch-chittorgarh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: chittorgarhUrl })
      });
      let data;
      try {
        data = await res.json();
      } catch (err) {
        throw new Error(`Invalid server response (Status: ${res.status}). The server might be down or returned an error page.`);
      }
      
      if (!res.ok) throw new Error(data.error || "Failed to fetch data");
      setFormData(prev => {
        const newData = JSON.parse(JSON.stringify(prev)); // Deep copy to safely modify arrays
        
        if (data.name) {
          newData.name = data.name;
          if (!prev.slug || prev.slug === generateSlug(prev.name)) {
            newData.slug = generateSlug(data.name);
          }
        }
        if (data.symbol) newData.symbol = data.symbol;
        if (data.description) newData.description = data.description;
        
        if (data.openDate) newData.openDate = data.openDate;
        if (data.closeDate) newData.closeDate = data.closeDate;
        if (data.listingDate) newData.listingDate = data.listingDate;
        if (data.priceBandLow) newData.priceBandLow = data.priceBandLow;
        if (data.priceBandHigh) newData.priceBandHigh = data.priceBandHigh;
        if (data.faceValue) newData.faceValue = data.faceValue;
        if (data.lotSize) newData.lotSize = data.lotSize;
        if (data.issueSize) newData.issueSize = data.issueSize;
        if (data.freshIssueSize) newData.freshIssueSize = data.freshIssueSize;
        if (data.offerForSaleSize) newData.offerForSaleSize = data.offerForSaleSize;
        if (data.currentGmp) {
          newData.currentGmp = data.currentGmp;
          newData.gmpUpdatedAt = new Date().toISOString().split('T')[0];
        }

        if (data.registrar) {
          newData.registrar = {
            name: data.registrar.name || '',
            phone: data.registrar.phone ? String(data.registrar.phone) : '',
            email: data.registrar.email || '',
            website: data.registrar.website || ''
          };
        }

        if (data.contact) {
          newData.contact = {
            address: data.contact.address || '',
            phone: data.contact.phone ? String(data.contact.phone) : '',
            email: data.contact.email || '',
            website: data.contact.website || ''
          };
        }

        if (data.leadManagers && Array.isArray(data.leadManagers)) {
          newData.leadManagers = data.leadManagers.map(String);
        }

        if (data.objectsOfTheIssue && Array.isArray(data.objectsOfTheIssue)) {
          newData.objectsOfTheIssue = data.objectsOfTheIssue.map(String);
        }
        
        if (data.aboutIpo) {
          newData.aboutIpo = data.aboutIpo;
        }

        if (data.faqs && Array.isArray(data.faqs)) {
          newData.faqs = data.faqs.map((faq: any) => ({
            question: String(faq.question || ''),
            answer: String(faq.answer || '')
          }));
        }

        const updateFieldArray = (arrName: keyof IPOData, id: string, val: any) => {
          if (val === undefined || val === null || val === '') return;
          if (!newData[arrName]) (newData[arrName] as any) = [];
          
          // Clone the array and its items to avoid mutating DEFAULT_IPO_TEMPLATE
          const arr = [...(newData[arrName] as any[])].map(item => ({...item}));
          newData[arrName] = arr as any;
          
          const idx = arr.findIndex(f => f.id === id);
          if (idx !== -1) {
             arr[idx].value = String(val);
          }
        };

        updateFieldArray('issueDetailsFields', 'priceBandLow', data.priceBandLow);
        updateFieldArray('issueDetailsFields', 'priceBandHigh', data.priceBandHigh);
        updateFieldArray('issueDetailsFields', 'faceValue', data.faceValue);
        updateFieldArray('issueDetailsFields', 'lotSize', data.lotSize);
        updateFieldArray('issueDetailsFields', 'totalIssueShares', data.issueSizeShares);
        updateFieldArray('issueDetailsFields', 'totalIssueSize', data.issueSize);
        updateFieldArray('issueDetailsFields', 'freshIssueShares', data.freshIssueShares);
        updateFieldArray('issueDetailsFields', 'freshIssue', data.freshIssueSize);
        updateFieldArray('issueDetailsFields', 'ofsShares', data.offerForSaleShares);
        updateFieldArray('issueDetailsFields', 'ofs', data.offerForSaleSize);
        updateFieldArray('issueDetailsFields', 'shareHoldingPreIssue', data.shareHoldingPreIssue);
        updateFieldArray('issueDetailsFields', 'shareHoldingPostIssue', data.shareHoldingPostIssue);

        updateFieldArray('timelineFields', 'openDate', data.openDate);
        updateFieldArray('timelineFields', 'closeDate', data.closeDate);
        updateFieldArray('timelineFields', 'listingDate', data.listingDate);

        if (data.timelineEvents && data.timelineEvents.length > 0) {
          newData.timelineFields = [...(newData.timelineFields || [])].map(item => ({...item}));
          const arr = newData.timelineFields;
          data.timelineEvents.forEach((te: any) => {
            const teLower = te.label.toLowerCase();
            const existingIdx = arr.findIndex((f: any) => 
              f.label.toLowerCase().includes(teLower) || teLower.includes(f.label.toLowerCase())
            );
            if (existingIdx !== -1) {
              arr[existingIdx].value = String(te.value);
            } else {
              arr.push({ id: `tl_${Date.now()}_${Math.random()}`, label: te.label, value: String(te.value) });
            }
          });
        }

        if (data.financialTable && data.financialTable.length > 0) {
          newData.financialTable = { columns: [...(newData.financialTable?.columns || [])], rows: [] };
          if (newData.financialTable.columns.length === 0) {
             newData.financialTable.columns = [
               { id: 'year', label: 'Year' },
               { id: 'revenue', label: 'Revenue (Cr)' },
               { id: 'expense', label: 'Expense (Cr)' },
               { id: 'profit', label: 'Profit (Cr)' },
               { id: 'assets', label: 'Assets (Cr)' },
               { id: 'networth', label: 'Net Worth (Cr)' }
             ];
          }
          const hasReserves = data.financialTable.some((r: any) => r.reserves);
          const hasBorrowing = data.financialTable.some((r: any) => r.borrowing);
          
          if (hasReserves && !newData.financialTable.columns.find((c:any) => c.id === 'reserves')) {
            newData.financialTable.columns.push({ id: 'reserves', label: 'Reserves (Cr)' });
          }
          if (hasBorrowing && !newData.financialTable.columns.find((c:any) => c.id === 'borrowing')) {
            newData.financialTable.columns.push({ id: 'borrowing', label: 'Borrowing (Cr)' });
          }

          newData.financialTable.rows = data.financialTable.map((row: any, i: number) => ({
             id: `row_${Date.now()}_${i}`,
             values: {
                year: row.year || '',
                revenue: row.revenue || row.totalIncome || '',
                expense: row.expense || '',
                profit: row.profit || '',
                assets: row.assets || '',
                networth: row.networth || '',
                ...(hasReserves && { reserves: row.reserves || '' }),
                ...(hasBorrowing && { borrowing: row.borrowing || '' })
             }
          }));
        }

        if (data.valuationMetrics) {
          newData.valuationFields = [...(newData.valuationFields || [])].map(item => ({...item}));
          data.valuationMetrics.forEach((ef: any) => {
             const searchLabel = ef.label.toLowerCase();
             const valIdx = newData.valuationFields!.findIndex((f: any) => searchLabel.includes(f.label.toLowerCase().replace(/ \(.+\)/, '')) || f.label.toLowerCase().includes(searchLabel));
             if (valIdx !== -1) { 
               newData.valuationFields![valIdx].value = String(ef.value); 
             } else {
               newData.valuationFields!.push({ id: `val_${Date.now()}_${Math.random()}`, label: ef.label, value: String(ef.value) });
             }
          });
        }

        if (data.subscriptionStatus) {
          newData.subscriptionFields = [...(newData.subscriptionFields || [])].map(item => ({...item}));
          data.subscriptionStatus.forEach((ef: any) => {
             const searchLabel = ef.label.toLowerCase();
             const subIdx = newData.subscriptionFields!.findIndex((f: any) => searchLabel.includes(f.label.toLowerCase().replace(' sub', '')) || f.label.toLowerCase().includes(searchLabel));
             if (subIdx !== -1) { 
               newData.subscriptionFields![subIdx].value = String(ef.value); 
             } else {
               newData.subscriptionFields!.push({ id: `sub_${Date.now()}_${Math.random()}`, label: ef.label, value: String(ef.value) });
             }
          });
        }

        if (data.quotaPercentages) {
          newData.quotaFields = [...(newData.quotaFields || [])].map(item => ({...item}));
          data.quotaPercentages.forEach((ef: any) => {
             const searchLabel = ef.label.toLowerCase();
             const qIdx = newData.quotaFields!.findIndex((f: any) => searchLabel.includes(f.label.toLowerCase().replace(' quota', '')) || f.label.toLowerCase().includes(searchLabel));
             if (qIdx !== -1) { 
               newData.quotaFields![qIdx].value = String(ef.value); 
             } else {
               newData.quotaFields!.push({ id: `quota_${Date.now()}_${Math.random()}`, label: ef.label, value: String(ef.value) });
             }
          });
        }

        if (data.additionalData && data.additionalData.length > 0) {
          const extraTabId = 'extra-data';
          if (!newData.customTabs) newData.customTabs = [];
          let tabIndex = newData.customTabs.findIndex((t: any) => t.id === extraTabId);
          if (tabIndex === -1) {
            newData.customTabs.push({ id: extraTabId, name: 'Others', fields: [] });
            tabIndex = newData.customTabs.length - 1;
          }
          
          data.additionalData.forEach((ad: any) => {
            newData.customTabs![tabIndex].fields.push({
              id: generateSlug(ad.title) + Math.random().toString(36).substring(7),
              name: ad.title,
              value: String(ad.content),
              type: 'textarea'
            });
          });
        }

        if (data.analysis) {
          newData.analysis = {
            verdict: data.analysis.verdict || '',
            reasoning: data.analysis.reasoning || ''
          };
        }

        if (data.registrar) {
          newData.registrar = { ...data.registrar };
        }
        
        if (data.contact) {
          newData.contact = { ...data.contact };
        }

        if (data.leadManagers) {
          newData.leadManagers = [...data.leadManagers];
        }

        return newData;
      });

      alert("Successfully generated IPO data by AI!");
    } catch (error: any) {
      console.error(error);
      alert("Failed to fetch IPO data: " + error.message);
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleAddCustomTab = () => {
    const tabName = prompt("Enter new tab name:");
    if (!tabName) return;
    const tabId = generateSlug(tabName);
    
    if (formData.customTabs?.some(t => t.id === tabId)) {
      alert("Tab already exists!");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      customTabs: [...(prev.customTabs || []), { id: tabId, name: tabName, fields: [] }]
    }));
    setActiveTab(tabId);
  };

  const handleAddCustomField = (tabId: string) => {
    const fieldName = prompt("Enter field name:");
    if (!fieldName) return;
    const fieldId = generateSlug(fieldName);
    
    setFormData(prev => {
      const tabs = [...(prev.customTabs || [])];
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
      
      return { ...prev, customTabs: tabs };
    });
  };

  const handleCustomFieldUpdate = (tabId: string, fieldId: string, key: 'value' | 'type', val: string) => {
    setFormData(prev => {
      const tabs = [...(prev.customTabs || [])];
      const tabIndex = tabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return prev;
      
      const newFields = tabs[tabIndex].fields.map(f => 
        f.id === fieldId ? { ...f, [key]: val } : f
      );
      
      tabs[tabIndex] = { ...tabs[tabIndex], fields: newFields };
      return { ...prev, customTabs: tabs };
    });
  };
  
  const handleRemoveCustomField = (tabId: string, fieldId: string) => {
    setFormData(prev => {
      const tabs = [...(prev.customTabs || [])];
      const tabIndex = tabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return prev;
      
      const newFields = tabs[tabIndex].fields.filter(f => f.id !== fieldId);
      tabs[tabIndex] = { ...tabs[tabIndex], fields: newFields };
      return { ...prev, customTabs: tabs };
    });
  };

  const handleMoveCustomField = (tabId: string, index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const tabs = [...(prev.customTabs || [])];
      const tabIndex = tabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return prev;
      
      const newFields = [...tabs[tabIndex].fields];
      if (direction === 'up' && index > 0) {
        [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      } else if (direction === 'down' && index < newFields.length - 1) {
        [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      }
      
      tabs[tabIndex] = { ...tabs[tabIndex], fields: newFields };
      return { ...prev, customTabs: tabs };
    });
  };

  const handleMoveCustomTab = (tabId: string, direction: 'left' | 'right') => {
    setFormData(prev => {
      const tabs = [...(prev.customTabs || [])];
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
      return { ...prev, customTabs: tabs };
    });
  };
  const renderCustomFields = (tabId: string) => {
    const tab = formData.customTabs?.find(t => t.id === tabId);
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
                    <option value="textarea">Textarea (Plain)</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="url">URL</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {(!field.type || field.type === 'text') ? (
                      <RichTextEditor value={field.value} onChange={(val) => handleCustomFieldUpdate(tabId, field.id, 'value', val)} />
                    ) : field.type === 'textarea' ? (
                      <textarea rows={5} value={field.value} onChange={(e) => handleCustomFieldUpdate(tabId, field.id, 'value', e.target.value)} className={styles.inputField} />
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
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "ipos"), { 
        ...formData, 
        createdAt: serverTimestamp() 
      });
      alert("IPO created successfully!");
      router.push('/admin/ipos');
    } catch (error) {
      console.error("Error creating IPO: ", error);
      alert("Failed to create IPO.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFinancialColumn = () => {
    const newColId = `col_${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      financialTable: {
        columns: [...(prev.financialTable?.columns || []), { id: newColId, label: 'New Column' }],
        rows: prev.financialTable?.rows || []
      }
    }));
  };

  const updateFinancialColumn = (index: number, label: string) => {
    const newCols = [...(formData.financialTable?.columns || [])];
    newCols[index] = { ...newCols[index], label };
    setFormData(prev => ({
      ...prev,
      financialTable: { ...prev.financialTable!, columns: newCols }
    }));
  };

  const removeFinancialColumn = (index: number) => {
    const colToRemove = formData.financialTable?.columns[index];
    if (!colToRemove) return;
    const newCols = formData.financialTable!.columns.filter((_, i) => i !== index);
    const newRows = (formData.financialTable?.rows || []).map(r => {
      const newVals = { ...r.values };
      delete newVals[colToRemove.id];
      return { ...r, values: newVals };
    });
    setFormData(prev => ({
      ...prev,
      financialTable: { columns: newCols, rows: newRows }
    }));
  };

  const addFinancialRow = () => {
    setFormData(prev => ({
      ...prev,
      financialTable: {
        columns: prev.financialTable?.columns || [],
        rows: [...(prev.financialTable?.rows || []), { id: `row_${Date.now()}`, values: {} }]
      }
    }));
  };

  const updateFinancialCell = (rowIdx: number, colId: string, value: string) => {
    const newRows = [...(formData.financialTable?.rows || [])];
    newRows[rowIdx] = {
      ...newRows[rowIdx],
      values: { ...newRows[rowIdx].values, [colId]: value }
    };
    setFormData(prev => ({
      ...prev,
      financialTable: { ...prev.financialTable!, rows: newRows }
    }));
  };

  const removeFinancialRow = (rowIdx: number) => {
    setFormData(prev => ({
      ...prev,
      financialTable: {
        columns: prev.financialTable?.columns || [],
        rows: (prev.financialTable?.rows || []).filter((_, i) => i !== rowIdx)
      }
    }));
  };

  const addGmpRecord = () => {
    setFormData(prev => ({
      ...prev,
      gmpHistory: [...(prev.gmpHistory || []), { date: '', price: 0, change: 0 }]
    }));
  };

  const updateGmpRecord = (index: number, field: string, value: any) => {
    const newGmp = [...(formData.gmpHistory || [])];
    newGmp[index] = { ...newGmp[index], [field]: value };
    setFormData(prev => ({ ...prev, gmpHistory: newGmp }));
  };

  const removeGmpRecord = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gmpHistory: (prev.gmpHistory || []).filter((_, i) => i !== index)
    }));
  };

  const addValuationField = () => {
    setFormData(prev => ({
      ...prev,
      valuationFields: [...(prev.valuationFields || []), { id: `val_${Date.now()}`, label: '', value: '' }]
    }));
  };

  const updateValuationField = (index: number, key: 'label' | 'value', value: string) => {
    const newFields = [...(formData.valuationFields || [])];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData(prev => ({ ...prev, valuationFields: newFields }));
  };

  const removeValuationField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      valuationFields: (prev.valuationFields || []).filter((_, i) => i !== index)
    }));
  };

  const addTimelineField = () => {
    setFormData(prev => ({
      ...prev,
      timelineFields: [...(prev.timelineFields || []), { id: `tl_${Date.now()}`, label: 'New Event', value: '' }]
    }));
  };

  const updateTimelineField = (index: number, key: 'label' | 'value', value: string) => {
    const newFields = [...(formData.timelineFields || [])];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData(prev => ({ ...prev, timelineFields: newFields }));
  };

  const removeTimelineField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      timelineFields: (prev.timelineFields || []).filter((_, i) => i !== index)
    }));
  };

  const addIssueDetailField = () => {
    setFormData(prev => ({
      ...prev,
      issueDetailsFields: [...(prev.issueDetailsFields || []), { id: `id_${Date.now()}`, label: 'New Field', value: '' }]
    }));
  };

  const updateIssueDetailField = (index: number, key: 'label' | 'value', value: string) => {
    const newFields = [...(formData.issueDetailsFields || [])];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData(prev => ({ ...prev, issueDetailsFields: newFields }));
  };

  const removeIssueDetailField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      issueDetailsFields: (prev.issueDetailsFields || []).filter((_, i) => i !== index)
    }));
  };

  const addSubscriptionField = () => {
    setFormData(prev => ({
      ...prev,
      subscriptionFields: [...(prev.subscriptionFields || []), { id: `sub_${Date.now()}`, label: 'New Field', value: '' }]
    }));
  };

  const updateSubscriptionField = (index: number, key: 'label' | 'value', value: string) => {
    const newFields = [...(formData.subscriptionFields || [])];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData(prev => ({ ...prev, subscriptionFields: newFields }));
  };

  const removeSubscriptionField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subscriptionFields: (prev.subscriptionFields || []).filter((_, i) => i !== index)
    }));
  };

  const addQuotaField = () => {
    setFormData(prev => ({
      ...prev,
      quotaFields: [...(prev.quotaFields || []), { id: `q_${Date.now()}`, label: 'New Quota', value: '' }]
    }));
  };

  const updateQuotaField = (index: number, key: 'label' | 'value', value: string) => {
    const newFields = [...(formData.quotaFields || [])];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormData(prev => ({ ...prev, quotaFields: newFields }));
  };

  const removeQuotaField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      quotaFields: (prev.quotaFields || []).filter((_, i) => i !== index)
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

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button type="button" onClick={() => router.push('/admin/ipos')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Add New IPO</h1>
      </div>

      <form onSubmit={handleSubmit} className={`premium-card`} style={{ padding: 0, overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '0.5rem 1rem 0 1rem', gap: '0.5rem', overflowX: 'auto' }}>
          <button type="button" onClick={() => setActiveTab('general')} style={getTabStyle('general')}>General</button>
          <button type="button" onClick={() => setActiveTab('timeline')} style={getTabStyle('timeline')}>Timeline</button>
          <button type="button" onClick={() => setActiveTab('price')} style={getTabStyle('price')}>Price & Size</button>
          <button type="button" onClick={() => setActiveTab('subscription')} style={getTabStyle('subscription')}>Subscription & Quota</button>
          <button type="button" onClick={() => setActiveTab('financials')} style={getTabStyle('financials')}>Financials</button>
          <button type="button" onClick={() => setActiveTab('affiliate')} style={getTabStyle('affiliate')}>Affiliate</button>
          <button type="button" onClick={() => setActiveTab('contact')} style={getTabStyle('contact')}>Registrar & Contact</button>
          <button type="button" onClick={() => setActiveTab('faqs')} style={getTabStyle('faqs')}>FAQs</button>
          {formData.customTabs?.filter(t => !['general', 'timeline', 'price', 'subscription', 'financials', 'affiliate', 'contact', 'faqs'].includes(t.id)).map((tab, idx, arr) => (
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
                <div className={styles.inputGroup} style={{ gridColumn: '1 / -1', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                      <label style={{ color: '#8b5cf6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        ✨ Generate IPO by AI
                      </label>
                      <input 
                        name="chittorgarhUrl" 
                        value={chittorgarhUrl} 
                        onChange={(e) => setChittorgarhUrl(e.target.value)} 
                        placeholder="Paste Chittorgarh IPO URL here (e.g. https://www.chittorgarh.com/ipo/...)" 
                        className={styles.inputField}
                        style={{ border: '1px solid #8b5cf655' }}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleFetchChittorgarh}
                      disabled={isFetchingData || !chittorgarhUrl}
                      style={{ 
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
                        border: 'none', 
                        color: 'white', 
                        padding: '0.75rem 1.5rem', 
                        borderRadius: '8px', 
                        cursor: isFetchingData || !chittorgarhUrl ? 'not-allowed' : 'pointer',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: isFetchingData || !chittorgarhUrl ? 0.7 : 1,
                        whiteSpace: 'nowrap',
                        height: '42px'
                      }}
                    >
                      {isFetchingData ? "Generating..." : "Generate by AI"}
                    </button>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Paste the Chittorgarh IPO link and AI will automatically fill the form fields and extract custom data!
                  </p>
                </div>

                <div className={styles.inputGroup}>
                  <label>Company Name</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Slug (URL)</label>
                  <input required name="slug" value={formData.slug || ''} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Symbol</label>
                  <input required name="symbol" value={formData.symbol} onChange={handleChange} className={styles.inputField} />
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
                <div className={styles.inputGroup}>
                  <label>Canonical URL (Optional)</label>
                  <input 
                    type="url"
                    name="canonicalUrl"
                    value={formData.canonicalUrl || ''} 
                    onChange={handleChange} 
                    placeholder="e.g. https://netprofit.in/ipo/my-ipo" 
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
                  <select name="type" value={formData.type} onChange={handleChange} className={styles.inputField}>
                    <option value={IPOType.MAINBOARD}>Mainboard</option>
                    <option value={IPOType.SME}>SME</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className={styles.inputField}>
                    <option value={IPOStatus.UPCOMING}>Upcoming</option>
                    <option value={IPOStatus.OPEN}>Open</option>
                    <option value={IPOStatus.CLOSED}>Closed</option>
                    <option value={IPOStatus.LISTED}>Listed</option>
                  </select>
                </div>
                <div className={styles.inputGroup} style={{ gridColumn: '1 / -1', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>AI Suggestion (Auto-generated)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div>
                      <label>AI Verdict</label>
                      <select 
                        value={formData.analysis?.verdict || ''} 
                        onChange={(e) => setFormData(prev => ({ ...prev, analysis: { ...prev.analysis, verdict: e.target.value, reasoning: prev.analysis?.reasoning || '' } }))} 
                        className={styles.inputField}
                      >
                        <option value="">None</option>
                        <option value="Apply">Apply</option>
                        <option value="Moderate Risk">Moderate Risk</option>
                        <option value="Avoid">Avoid</option>
                      </select>
                    </div>
                    <div>
                      <label>AI Reasoning</label>
                      <textarea 
                        value={formData.analysis?.reasoning || ''} 
                        onChange={(e) => setFormData(prev => ({ ...prev, analysis: { ...prev.analysis, reasoning: e.target.value, verdict: prev.analysis?.verdict || '' } }))} 
                        className={styles.inputField} 
                        rows={2} 
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Description (About IPO)</label>
                <RichTextEditor value={formData.aboutIpo || ''} onChange={(val) => setFormData(prev => ({ ...prev, aboutIpo: val }))} />
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Description (About Company)</label>
                <RichTextEditor value={formData.description} onChange={(val) => setFormData(prev => ({ ...prev, description: val }))} />
              </div>
              <div className={styles.sectionCard} style={{ padding: '1.5rem', background: 'transparent' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-color)' }}>Objects of the Issue</h3>
                <div className={styles.inputGroup}>
                  <label>Reasons for the IPO (One per line)</label>
                  <textarea 
                    rows={4} 
                    value={formData.objectsOfTheIssue?.join('\n') || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, objectsOfTheIssue: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))} 
                    className={styles.inputField} 
                    placeholder="e.g. Repayment of borrowings&#10;General corporate purposes"
                  />
                </div>
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

              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-color)', margin: '0 0 1rem 0' }}>Financial Records Data</h3>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: 'var(--card-bg)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '0.5rem' }}>Period Ended / Attributes</th>
                      {formData.financialTable?.rows.map((row, rowIdx) => (
                        <th key={row.id} style={{ padding: '0.5rem', minWidth: '150px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              placeholder="Year (e.g. 31 Mar 2026)"
                              value={row.values['year'] || ''} 
                              onChange={(e) => updateFinancialCell(rowIdx, 'year', e.target.value)} 
                              className={styles.inputField} 
                            />
                            <button type="button" onClick={() => removeFinancialRow(rowIdx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash size={16}/></button>
                          </div>
                        </th>
                      ))}
                      <th style={{ padding: '0.5rem' }}>
                        <button type="button" onClick={addFinancialRow} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                          <Plus size={14}/> Add Year
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.financialTable?.columns.filter(c => c.id !== 'year').map((col) => {
                      const realColIdx = formData.financialTable!.columns.findIndex(c => c.id === col.id);
                      return (
                      <tr key={col.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              value={col.label} 
                              onChange={(e) => updateFinancialColumn(realColIdx, e.target.value)}
                              className={styles.inputField} 
                              placeholder="Attribute Name"
                            />
                            <button type="button" onClick={() => removeFinancialColumn(realColIdx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash size={14}/></button>
                          </div>
                        </td>
                        {formData.financialTable!.rows.map((row, rowIdx) => (
                          <td key={`${col.id}_${row.id}`} style={{ padding: '0.5rem' }}>
                            <input 
                              value={row.values[col.id] || ''} 
                              onChange={(e) => updateFinancialCell(rowIdx, col.id, e.target.value)} 
                              className={styles.inputField} 
                            />
                          </td>
                        ))}
                        <td style={{ padding: '0.5rem' }}></td>
                      </tr>
                    )})}
                    <tr>
                      <td style={{ padding: '0.5rem', paddingTop: '1rem' }}>
                        <button type="button" onClick={addFinancialColumn} style={{ background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', color: 'var(--icon-color)', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', width: '100%', justifyContent: 'center' }}>
                          <Plus size={14}/> Add Attribute
                        </button>
                      </td>
                      <td colSpan={(formData.financialTable?.rows.length || 0) + 1}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
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

          {activeTab === 'contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className={styles.sectionCard} style={{ padding: '1.5rem', background: 'transparent' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-color)' }}>IPO Registrar</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={styles.inputGroup}>
                    <label>Name</label>
                    <input value={formData.registrar?.name || ''} onChange={(e) => handleNestedChange('registrar', 'name', e.target.value)} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Phone</label>
                    <input value={formData.registrar?.phone || ''} onChange={(e) => handleNestedChange('registrar', 'phone', e.target.value)} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Email</label>
                    <input type="email" value={formData.registrar?.email || ''} onChange={(e) => handleNestedChange('registrar', 'email', e.target.value)} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Website</label>
                    <input type="url" value={formData.registrar?.website || ''} onChange={(e) => handleNestedChange('registrar', 'website', e.target.value)} className={styles.inputField} />
                  </div>
                </div>
              </div>

              <div className={styles.sectionCard} style={{ padding: '1.5rem', background: 'transparent' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-color)' }}>Company Contact Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                    <label>Address</label>
                    <textarea rows={3} value={formData.contact?.address || ''} onChange={(e) => handleNestedChange('contact', 'address', e.target.value)} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Phone</label>
                    <input value={formData.contact?.phone || ''} onChange={(e) => handleNestedChange('contact', 'phone', e.target.value)} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Email</label>
                    <input type="email" value={formData.contact?.email || ''} onChange={(e) => handleNestedChange('contact', 'email', e.target.value)} className={styles.inputField} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Website</label>
                    <input type="url" value={formData.contact?.website || ''} onChange={(e) => handleNestedChange('contact', 'website', e.target.value)} className={styles.inputField} />
                  </div>
                </div>
              </div>

              <div className={styles.sectionCard} style={{ padding: '1.5rem', background: 'transparent' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-color)' }}>Lead Managers</h3>
                <div className={styles.inputGroup}>
                  <label>Managers (Comma-separated)</label>
                  <textarea 
                    rows={4} 
                    value={formData.leadManagers?.join(', ') || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, leadManagers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} 
                    className={styles.inputField} 
                    placeholder="e.g. ICICI Securities, HSBC Securities..."
                  />
                </div>
              </div>
              
              {renderCustomFields('contact')}
            </div>
          )}

          {activeTab === 'faqs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className={styles.sectionCard} style={{ padding: '1.5rem', background: 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-color)' }}>Frequently Asked Questions</h3>
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, faqs: [...(prev.faqs || []), { question: '', answer: '' }] }))} style={{ background: 'none', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={14} /> Add FAQ
                  </button>
                </div>
                
                {(!formData.faqs || formData.faqs.length === 0) ? (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No FAQs added yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {formData.faqs.map((faq, index) => (
                      <div key={index} style={{ padding: '1rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative' }}>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, faqs: prev.faqs?.filter((_, i) => i !== index) }))} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash size={16} />
                        </button>
                        <div className={styles.inputGroup} style={{ marginBottom: '1rem', paddingRight: '2rem' }}>
                          <label>Question</label>
                          <input 
                            value={faq.question} 
                            onChange={(e) => {
                              const newFaqs = [...(formData.faqs || [])];
                              newFaqs[index].question = e.target.value;
                              setFormData(prev => ({ ...prev, faqs: newFaqs }));
                            }} 
                            className={styles.inputField} 
                            placeholder="e.g. What is the minimum lot size?"
                          />
                        </div>
                        <div className={styles.inputGroup}>
                          <label>Answer</label>
                          <textarea 
                            rows={3} 
                            value={faq.answer} 
                            onChange={(e) => {
                              const newFaqs = [...(formData.faqs || [])];
                              newFaqs[index].answer = e.target.value;
                              setFormData(prev => ({ ...prev, faqs: newFaqs }));
                            }} 
                            className={styles.inputField} 
                            placeholder="e.g. The minimum lot size is 66 shares."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {renderCustomFields('faqs')}
            </div>
          )}

          {!['general', 'timeline', 'price', 'subscription', 'financials', 'affiliate', 'contact', 'faqs'].includes(activeTab) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {renderCustomFields(activeTab)}
            </div>
          )}
        </div>

        <div style={{ padding: '1rem 2rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" onClick={() => router.push('/admin/ipos')} className={styles.submitBtn} style={{ background: '#64748b' }}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save IPO"}
          </button>
        </div>
      </form>
    </div>
  );
}
