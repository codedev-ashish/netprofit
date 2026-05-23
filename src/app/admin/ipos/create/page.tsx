"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../../../src/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import styles from "../../page.module.css";
import { ArrowLeft, Plus, Trash } from "lucide-react";
import { IPOData, DEFAULT_IPO_TEMPLATE, IPOType, IPOStatus } from "../types";

export default function CreateIPOForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<IPOData>(DEFAULT_IPO_TEMPLATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

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

  const addFinancialYear = () => {
    setFormData(prev => ({
      ...prev,
      financials: [...prev.financials, { year: '', revenue: 0, expense: 0, profit: 0, assets: 0, netWorth: 0, reserves: 0, debt: 0 }]
    }));
  };

  const updateFinancialYear = (index: number, field: string, value: any) => {
    const newFinancials = [...formData.financials];
    newFinancials[index] = { ...newFinancials[index], [field]: value };
    setFormData(prev => ({ ...prev, financials: newFinancials }));
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
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '0.5rem 1rem 0 1rem', gap: '0.5rem' }}>
          <button type="button" onClick={() => setActiveTab('general')} style={getTabStyle('general')}>General</button>
          <button type="button" onClick={() => setActiveTab('timeline')} style={getTabStyle('timeline')}>Timeline</button>
          <button type="button" onClick={() => setActiveTab('price')} style={getTabStyle('price')}>Price & Size</button>
          <button type="button" onClick={() => setActiveTab('financials')} style={getTabStyle('financials')}>Financials</button>
          <button type="button" onClick={() => setActiveTab('affiliate')} style={getTabStyle('affiliate')}>Affiliate</button>
        </div>

        <div style={{ padding: '2rem' }}>
          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              </div>
              <div className={styles.inputGroup}>
                <label>Description (About Company)</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className={styles.inputField} />
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.inputGroup}>
                  <label>Open Date</label>
                  <input type="date" value={formData.timeline.openDate} onChange={(e) => handleNestedChange('timeline', 'openDate', e.target.value)} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Close Date</label>
                  <input type="date" value={formData.timeline.closeDate} onChange={(e) => handleNestedChange('timeline', 'closeDate', e.target.value)} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Basis of Allotment</label>
                  <input type="date" value={formData.timeline.basisOfAllotment} onChange={(e) => handleNestedChange('timeline', 'basisOfAllotment', e.target.value)} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Listing Date</label>
                  <input type="date" value={formData.timeline.listingDate} onChange={(e) => handleNestedChange('timeline', 'listingDate', e.target.value)} className={styles.inputField} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'price' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className={styles.inputGroup}>
                  <label>Price Band Low</label>
                  <input type="number" name="priceBandLow" value={formData.priceBandLow} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Price Band High</label>
                  <input type="number" name="priceBandHigh" value={formData.priceBandHigh} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Face Value</label>
                  <input type="number" name="faceValue" value={formData.faceValue} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Lot Size</label>
                  <input type="number" name="lotSize" value={formData.lotSize} onChange={handleChange} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Issue Size (Cr)</label>
                  <input type="number" name="issueSize" value={formData.issueSize} onChange={handleChange} className={styles.inputField} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {formData.financials.map((fy, idx) => (
                <div key={idx} style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px', background: 'var(--bg-secondary)', position: 'relative' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Year</label>
                      <input value={fy.year} onChange={(e) => updateFinancialYear(idx, 'year', e.target.value)} className={styles.inputField} placeholder="e.g. FY23" />
                    </div>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Revenue (Cr)</label>
                      <input type="number" value={fy.revenue} onChange={(e) => updateFinancialYear(idx, 'revenue', parseFloat(e.target.value))} className={styles.inputField} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Profit (Cr)</label>
                      <input type="number" value={fy.profit} onChange={(e) => updateFinancialYear(idx, 'profit', parseFloat(e.target.value))} className={styles.inputField} />
                    </div>
                    <div className={styles.inputGroup}>
                      <label style={{fontSize: '0.8rem'}}>Assets (Cr)</label>
                      <input type="number" value={fy.assets} onChange={(e) => updateFinancialYear(idx, 'assets', parseFloat(e.target.value))} className={styles.inputField} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addFinancialYear} style={{ background: 'none', border: '1px dashed var(--border-color)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: '#60a5fa' }}>
                <Plus size={18} /> Add Financial Year
              </button>
            </div>
          )}

          {activeTab === 'affiliate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className={styles.inputGroup}>
                <label>Affiliate Link (Apply URL)</label>
                <input type="url" name="affiliateLink" value={formData.affiliateLink || ''} onChange={handleChange} className={styles.inputField} placeholder="https://..." />
              </div>
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
