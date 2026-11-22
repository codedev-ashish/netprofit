"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../../src/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Trash2, Edit2 } from "lucide-react";
import RichTextEditor from "../../../../src/components/RichTextEditor";

export default function AdminServices() {
  const [serviceName, setServiceName] = useState("");
  const [slug, setSlug] = useState("");
  const [serviceCategory, setServiceCategory] = useState("Registration");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceDocumentsRequired, setServiceDocumentsRequired] = useState<string[]>([]);
  const [servicePeriod, setServicePeriod] = useState("one-time");
  const [serviceRecurring, setServiceRecurring] = useState(false);
  const [isCombo, setIsCombo] = useState(false);
  const [comboServices, setComboServices] = useState<string[]>([]);
  const [annualOnly, setAnnualOnly] = useState(false);
  const [oneTimePrice, setOneTimePrice] = useState<number>(0);
  const [oneTimeDiscountType, setOneTimeDiscountType] = useState('none');
  const [oneTimeDiscountValue, setOneTimeDiscountValue] = useState<number>(0);
  
  const [halfYearlyPrice, setHalfYearlyPrice] = useState<number>(0);
  const [halfYearlyDiscountType, setHalfYearlyDiscountType] = useState('none');
  const [halfYearlyDiscountValue, setHalfYearlyDiscountValue] = useState<number>(0);
  
  const [annualPrice, setAnnualPrice] = useState<number>(0);
  const [annualDiscountType, setAnnualDiscountType] = useState('none');
  const [annualDiscountValue, setAnnualDiscountValue] = useState<number>(0);

  const [multiBusinessOneTimePrice, setMultiBusinessOneTimePrice] = useState<number>(0);
  const [multiBusinessHalfYearlyPrice, setMultiBusinessHalfYearlyPrice] = useState<number>(0);
  const [multiBusinessAnnualPrice, setMultiBusinessAnnualPrice] = useState<number>(0);

  const [customSections, setCustomSections] = useState<{title: string, content: string}[]>([]);
  const [pricingPlans, setPricingPlans] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<{question: string, answer: string}[]>([]);
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroTrustTitle, setHeroTrustTitle] = useState("");
  const [heroTrustBadges, setHeroTrustBadges] = useState("");

  const [processSteps, setProcessSteps] = useState<{ icon: string; title: string; desc: string }[]>([]);
  const [processBenefits, setProcessBenefits] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<{ title: string; desc: string }[]>([]);
  const [reviews, setReviews] = useState<{ name: string; type: string; date: string; text: string; rating: string }[]>([]);
  const [importanceCards, setImportanceCards] = useState<{ icon: string; title: string; desc: string }[]>([]);
  const [serviceFeatures, setServiceFeatures] = useState<string[]>(["Professional Assistance", "100% Online Process", "Dedicated Support", "Secure Payment"]);
  const [serviceContent, setServiceContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [customSchema, setCustomSchema] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    hero: true,
    overview: true,
    trustStats: true,
    pricing: true,
    benefits: true,
    category: true,
    process: true,
    detailedInfo: true,
    customSections: true,
    faqs: true,
    combo: true,
    importance: true,
    reviews: true
  });
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);



  useEffect(() => {
    fetchServices();
  }, []);

  const generateSlug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setServiceName(val);
    if (!slug || slug === generateSlug(serviceName)) {
      setSlug(generateSlug(val));
    }
  };

  const fetchServices = async () => {
    const querySnapshot = await getDocs(collection(db, "services"));
    const servicesData: any[] = [];
    querySnapshot.forEach((doc) => {
      servicesData.push({ id: doc.id, ...doc.data() });
    });
    setServicesList(servicesData);
  };

  const handleOptimizeSEO = async () => {
    if (!serviceContent && !serviceDescription) {
      alert("Please add some description or content first to generate SEO.");
      return;
    }
    setIsOptimizing(true);
    try {
      const res = await fetch("/api/ai/generate-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: serviceName, 
          content: serviceContent || serviceDescription, 
          type: "service" 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate SEO");

      if (data.metaTitle) setMetaTitle(data.metaTitle);
      if (data.metaDescription) setMetaDescription(data.metaDescription);
      if (data.seoKeywords) setSeoKeywords(data.seoKeywords);
      
      // We prioritize updating the rich content if it was generated
      if (data.optimizedContent) {
        if (serviceContent) setServiceContent(data.optimizedContent);
        else setServiceDescription(data.optimizedContent);
      }

      alert("AI successfully optimized the SEO and injected contextual links!");
    } catch (error: any) {
      console.error(error);
      alert("SEO Optimization failed: " + error.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerateDetailsAI = async () => {
    if (!serviceName) {
      alert("Please enter a Service Name first.");
      return;
    }
    setIsGeneratingDetails(true);
    try {
      const res = await fetch("/api/ai/generate-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: serviceName, 
          type: serviceCategory 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate details");

      if (data.generatedHtml) {
        setServiceContent(data.generatedHtml);
        alert("Detailed Information successfully generated via AI!");
      }
    } catch (error: any) {
      console.error(error);
      alert("AI Generation failed: " + error.message);
    } finally {
      setIsGeneratingDetails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const serviceData = {
      name: serviceName,
      slug,
      category: serviceCategory,
      description: serviceDescription,
      documentsRequired: serviceDocumentsRequired,
      period: servicePeriod,
      isRecurring: serviceRecurring,
      annualOnly: annualOnly,
      isCombo: isCombo,
      comboServices: isCombo ? comboServices : [],
      oneTimePrice,
      oneTimeDiscountType,
      oneTimeDiscountValue,
      halfYearlyPrice,
      halfYearlyDiscountType,
      halfYearlyDiscountValue,
      annualPrice,
      annualDiscountType,
      annualDiscountValue,
      multiBusinessOneTimePrice,
      multiBusinessHalfYearlyPrice,
      multiBusinessAnnualPrice,
      customSections,
      pricingPlans,
      faqs,
      processSteps,
      processBenefits,
      benefits,
      reviews,
      importanceCards,
      features: serviceFeatures,
      heroSubtitle,
      heroTrustTitle,
      heroTrustBadges,
      content: serviceContent,
      metaTitle,
      metaDescription,
      seoKeywords,
      customSchema,
      isPublished,
      showReviews,
      visibility
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "services", editingId), serviceData);
        alert("Service updated successfully!");
      } else {
        await addDoc(collection(db, "services"), { ...serviceData, createdAt: serverTimestamp() });
        alert("Service added successfully!");
      }
      resetForm();
      fetchServices();
    } catch (error) {
      console.error("Error saving service: ", error);
      alert("Failed to save service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteService = async (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteDoc(doc(db, "services", id));
        fetchServices();
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    }
  };

  const togglePublishStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "services", id), { isPublished: !currentStatus });
      fetchServices();
    } catch (error) {
      console.error("Error toggling publish status:", error);
      alert("Failed to update status.");
    }
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setServiceName(s.name);
    setSlug(s.slug || "");
    setServiceCategory(s.category);
    setServiceDescription(s.description);
    setServiceDocumentsRequired(Array.isArray(s.documentsRequired) ? s.documentsRequired : (s.documentsRequired ? [s.documentsRequired] : []));
    setServicePeriod(s.period);
    setServiceRecurring(s.isRecurring);
    setAnnualOnly(s.annualOnly || false);
    setIsCombo(s.isCombo || false);
    setComboServices(s.comboServices || []);
    setOneTimePrice(s.oneTimePrice || 0);
    setOneTimeDiscountType(s.oneTimeDiscountType || 'none');
    setOneTimeDiscountValue(s.oneTimeDiscountValue || 0);
    
    setHalfYearlyPrice(s.halfYearlyPrice || 0);
    setHalfYearlyDiscountType(s.halfYearlyDiscountType || 'none');
    setHalfYearlyDiscountValue(s.halfYearlyDiscountValue || 0);
    
    setAnnualPrice(s.annualPrice || 0);
    setAnnualDiscountType(s.annualDiscountType || 'none');
    setAnnualDiscountValue(s.annualDiscountValue || 0);

    setMultiBusinessOneTimePrice(s.multiBusinessOneTimePrice || 0);
    setMultiBusinessHalfYearlyPrice(s.multiBusinessHalfYearlyPrice || 0);
    setMultiBusinessAnnualPrice(s.multiBusinessAnnualPrice || 0);

    setCustomSections(s.customSections || []);
    setPricingPlans(s.pricingPlans || []);
    setFaqs(s.faqs || []);
    setProcessSteps(s.processSteps || []);
    setProcessBenefits(s.processBenefits || []);
    setBenefits(s.benefits || []);
    setReviews(s.reviews || []);
    setImportanceCards(s.importanceCards || []);

    setServiceFeatures(s.features || ["Professional Assistance", "100% Online Process", "Dedicated Support", "Secure Payment"]);
    setHeroSubtitle(s.heroSubtitle || "");
    setHeroTrustTitle(s.heroTrustTitle || "");
    setHeroTrustBadges(s.heroTrustBadges || "");
    setServiceContent(s.content || "");
    setMetaTitle(s.metaTitle || "");
    setMetaDescription(s.metaDescription || "");
    setSeoKeywords(s.seoKeywords || "");
    setCustomSchema(s.customSchema || "");
    setIsPublished(s.isPublished !== false);
    setShowReviews(s.showReviews !== false);
    setVisibility(s.visibility || {
      hero: true, overview: true, trustStats: true, pricing: true, benefits: true,
      category: true, process: true, detailedInfo: true, customSections: true,
      faqs: true, combo: true, importance: true, reviews: true
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setServiceName("");
    setSlug("");
    setServiceDescription("");
    setServiceDocumentsRequired([]);
    setServiceRecurring(false);
    setAnnualOnly(false);
    setIsCombo(false);
    setComboServices([]);
    setServicePeriod("one-time");
    setServiceCategory("Registration");
    setOneTimePrice(0);
    setOneTimeDiscountType('none');
    setOneTimeDiscountValue(0);
    setHalfYearlyPrice(0);
    setHalfYearlyDiscountType('none');
    setHalfYearlyDiscountValue(0);
    setAnnualPrice(0);
    setAnnualDiscountType('none');
    setAnnualDiscountValue(0);

    setMultiBusinessOneTimePrice(0);
    setMultiBusinessHalfYearlyPrice(0);
    setMultiBusinessAnnualPrice(0);

    setCustomSections([]);
    setPricingPlans([]);
    setFaqs([]);
    setProcessSteps([]);
    setProcessBenefits([]);
    setBenefits([]);
    setReviews([]);
    setImportanceCards([]);

    setServiceFeatures(["Professional Assistance", "100% Online Process", "Dedicated Support", "Secure Payment"]);
    setHeroSubtitle("");
    setHeroTrustTitle("");
    setHeroTrustBadges("");
    setServiceContent("");
    setMetaTitle("");
    setMetaDescription("");
    setSeoKeywords("");
    setCustomSchema("");
    setIsPublished(true);
    setShowReviews(true);
    setVisibility({
      hero: true, overview: true, trustStats: true, pricing: true, benefits: true,
      category: true, process: true, detailedInfo: true, customSections: true,
      faqs: true, combo: true, importance: true, reviews: true
    });
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Manage Services</h1>
      <p className={styles.pageSubtitle}>Add, edit, or remove services offered to users.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>{editingId ? "Edit Service" : "Add New Service"}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Service Name</label>
            <input type="text" value={serviceName} onChange={handleNameChange} required className={styles.inputField} />
          </div>
          <div className={styles.inputGroup}>
            <label>Slug (URL)</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className={styles.inputField} />
          </div>
          <div className={styles.inputGroup}>
            <label>Category</label>
            <select value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)} className={styles.inputField}>
              <option value="Registration">Registration</option>
              <option value="Filing Returns">Filing Returns</option>
              <option value="Accounting">Accounting</option>
              <option value="Compliance">Compliance</option>
            </select>
          </div>

          {/* Hero Section Customization */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-color)', fontSize: '1.1rem' }}>Hero Section Customization</h3>
            
            <div className={styles.inputGroup}>
              <label>Hero Subtitle</label>
              <input 
                type="text" 
                value={heroSubtitle} 
                onChange={(e) => setHeroSubtitle(e.target.value)} 
                placeholder="e.g. - for Business Growth & Compliance" 
                className={styles.inputField} 
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Trust Banner Title</label>
              <input 
                type="text" 
                value={heroTrustTitle} 
                onChange={(e) => setHeroTrustTitle(e.target.value)} 
                placeholder="e.g. Trusted by 12000+ Founders Across India" 
                className={styles.inputField} 
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Trust Banner Badges</label>
              <input 
                type="text" 
                value={heroTrustBadges} 
                onChange={(e) => setHeroTrustBadges(e.target.value)} 
                placeholder="e.g. 100% Secure Platform • Verified Experts • Pan-India Service" 
                className={styles.inputField} 
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Note: Hero Title is the Service Name. The 6-grid features are pulled from the "Service Features" list below.</p>
          </div>

          <div className={styles.inputGroup} style={{ paddingBottom: '2rem' }}>
            <label>Description</label>
            <RichTextEditor value={serviceDescription} onChange={setServiceDescription} />
          </div>
          <div className={styles.inputGroup}>
            <label>Documents Required</label>
            {serviceDocumentsRequired.map((docItem, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input 
                  type="text" 
                  value={docItem}
                  onChange={(e) => {
                    const newDocs = [...serviceDocumentsRequired];
                    newDocs[idx] = e.target.value;
                    setServiceDocumentsRequired(newDocs);
                  }}
                  className={styles.inputField} 
                  style={{ flexGrow: 1 }}
                />
                <button type="button" onClick={() => {
                  const newDocs = serviceDocumentsRequired.filter((_, i) => i !== idx);
                  setServiceDocumentsRequired(newDocs);
                }} style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', padding: '0 1rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  X
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setServiceDocumentsRequired([...serviceDocumentsRequired, ""])} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              + Add Document
            </button>
          </div>
          <div className={styles.inputGroup} style={{flexDirection: 'row', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
            <input type="checkbox" id="recurringTop" checked={serviceRecurring} onChange={(e) => setServiceRecurring(e.target.checked)} style={{width: '20px', height: '20px', accentColor: 'var(--primary-color)'}} />
            <label htmlFor="recurringTop" style={{fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-color)', cursor: 'pointer', margin: 0}}>This is a Recurring Service (Half-Yearly / Annual)</label>
          </div>

          {!serviceRecurring ? (
            <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1.5rem', background: 'var(--bg-secondary)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-color)' }}>One-Time Pricing (Single Business)</h3>
              <div className={styles.inputGroup}>
                <label>One-Time Price (₹)</label>
                <input type="number" value={Number.isNaN(oneTimePrice) ? '' : oneTimePrice} onChange={(e) => setOneTimePrice(parseFloat(e.target.value))} required={!serviceRecurring} className={styles.inputField} min="0" step="0.01" />
              </div>
              <div className={styles.inputGroup}>
                <label>Discount</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <select value={oneTimeDiscountType} onChange={(e) => setOneTimeDiscountType(e.target.value)} className={styles.inputField} style={{ flex: 1 }}>
                    <option value="none">No Discount</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="amount">Flat Amount (₹)</option>
                  </select>
                  {oneTimeDiscountType !== 'none' && (
                    <input 
                      type="number" 
                      value={Number.isNaN(oneTimeDiscountValue) ? '' : oneTimeDiscountValue} 
                      onChange={(e) => setOneTimeDiscountValue(parseFloat(e.target.value))} 
                      className={styles.inputField} 
                      style={{ flex: 1 }} 
                      placeholder={oneTimeDiscountType === 'percentage' ? "e.g. 10 for 10%" : "e.g. 500 for ₹500 off"}
                      min="0"
                    />
                  )}
                </div>
              </div>
              <h3 style={{ margin: '1.5rem 0 1rem 0', color: 'var(--text-color)' }}>One-Time Pricing (Multi-Business)</h3>
              <div className={styles.inputGroup}>
                <label>Multi-Business One-Time Price (₹)</label>
                <input type="number" value={Number.isNaN(multiBusinessOneTimePrice) ? '' : multiBusinessOneTimePrice} onChange={(e) => setMultiBusinessOneTimePrice(parseFloat(e.target.value))} className={styles.inputField} min="0" step="0.01" />
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1.5rem', background: 'var(--bg-secondary)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-color)' }}>Recurring Pricing</h3>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="annualOnlyCheck" checked={annualOnly} onChange={(e) => setAnnualOnly(e.target.checked)} style={{ width: 'auto', transform: 'scale(1.2)', cursor: 'pointer' }} />
                <label htmlFor="annualOnlyCheck" style={{ color: 'var(--text-color)', cursor: 'pointer', fontWeight: 600 }}>This is a Recurring Service (Annual Only)</label>
              </div>
              
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', opacity: annualOnly ? 0.3 : 1, pointerEvents: annualOnly ? 'none' : 'auto' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-color)' }}>Half Yearly Plan</h4>
                  <div className={styles.inputGroup}>
                    <label style={{ color: 'var(--text-color)' }}>Price (₹)</label>
                    <input type="number" value={Number.isNaN(halfYearlyPrice) ? '' : halfYearlyPrice} onChange={(e) => setHalfYearlyPrice(parseFloat(e.target.value))} required={serviceRecurring && !annualOnly} className={styles.inputField} min="0" step="0.01" />
                  </div>
                  <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                    <label style={{ color: 'var(--text-color)' }}>Discount</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <select value={halfYearlyDiscountType} onChange={(e) => setHalfYearlyDiscountType(e.target.value)} className={styles.inputField} style={{ flex: 1 }}>
                        <option value="none">None</option>
                        <option value="percentage">%</option>
                        <option value="amount">₹</option>
                      </select>
                      {halfYearlyDiscountType !== 'none' && (
                        <input 
                          type="number" 
                          value={Number.isNaN(halfYearlyDiscountValue) ? '' : halfYearlyDiscountValue} 
                          onChange={(e) => setHalfYearlyDiscountValue(parseFloat(e.target.value))} 
                          className={styles.inputField} 
                          style={{ flex: 1 }} 
                          min="0"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '250px', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px', background: 'rgba(0,0,0,0.2)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-color)' }}>Annual Plan</h4>
                  <div className={styles.inputGroup}>
                    <label style={{ color: 'var(--text-color)' }}>Price (₹)</label>
                    <input type="number" value={Number.isNaN(annualPrice) ? '' : annualPrice} onChange={(e) => setAnnualPrice(parseFloat(e.target.value))} required={serviceRecurring} className={styles.inputField} min="0" step="0.01" />
                  </div>
                  <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                    <label style={{ color: 'var(--text-color)' }}>Discount</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <select value={annualDiscountType} onChange={(e) => setAnnualDiscountType(e.target.value)} className={styles.inputField} style={{ flex: 1 }}>
                        <option value="none">None</option>
                        <option value="percentage">%</option>
                        <option value="amount">₹</option>
                      </select>
                      {annualDiscountType !== 'none' && (
                        <input 
                          type="number" 
                          value={Number.isNaN(annualDiscountValue) ? '' : annualDiscountValue} 
                          onChange={(e) => setAnnualDiscountValue(parseFloat(e.target.value))} 
                          className={styles.inputField} 
                          style={{ flex: 1 }} 
                          min="0"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <h3 style={{ margin: '1.5rem 0 1rem 0', color: 'var(--text-color)' }}>Recurring Pricing (Multi-Business)</h3>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', opacity: annualOnly ? 0.3 : 1, pointerEvents: annualOnly ? 'none' : 'auto' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-color)' }}>Multi-Business Half Yearly Plan</h4>
                  <div className={styles.inputGroup}>
                    <label style={{ color: 'var(--text-color)' }}>Price (₹)</label>
                    <input type="number" value={Number.isNaN(multiBusinessHalfYearlyPrice) ? '' : multiBusinessHalfYearlyPrice} onChange={(e) => setMultiBusinessHalfYearlyPrice(parseFloat(e.target.value))} className={styles.inputField} min="0" step="0.01" />
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '250px', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '6px', background: 'rgba(0,0,0,0.2)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-color)' }}>Multi-Business Annual Plan</h4>
                  <div className={styles.inputGroup}>
                    <label style={{ color: 'var(--text-color)' }}>Price (₹)</label>
                    <input type="number" value={Number.isNaN(multiBusinessAnnualPrice) ? '' : multiBusinessAnnualPrice} onChange={(e) => setMultiBusinessAnnualPrice(parseFloat(e.target.value))} className={styles.inputField} min="0" step="0.01" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className={styles.inputGroup}>
            <label>Pricing Features (Benefits)</label>
            {serviceFeatures.map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input 
                  type="text" 
                  value={feat}
                  onChange={(e) => {
                    const newFeatures = [...serviceFeatures];
                    newFeatures[idx] = e.target.value;
                    setServiceFeatures(newFeatures);
                  }}
                  className={styles.inputField} 
                  style={{ flexGrow: 1 }}
                />
                <button type="button" onClick={() => {
                  const newFeatures = serviceFeatures.filter((_, i) => i !== idx);
                  setServiceFeatures(newFeatures);
                }} style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', padding: '0 1rem', cursor: 'pointer', fontWeight: 'bold' }}>
                  X
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setServiceFeatures([...serviceFeatures, ""])} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              + Add Feature
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label>Pricing Plans</label>
            {pricingPlans.map((plan, idx) => (
              <div key={idx} style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <strong>Plan {idx + 1}</strong>
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    <button type="button" onClick={() => {
                      if (idx > 0) {
                        const newPlans = [...pricingPlans];
                        [newPlans[idx-1], newPlans[idx]] = [newPlans[idx], newPlans[idx-1]];
                        setPricingPlans(newPlans);
                      }
                    }} style={{ cursor: 'pointer' }}>↑</button>
                    <button type="button" onClick={() => {
                      if (idx < pricingPlans.length - 1) {
                        const newPlans = [...pricingPlans];
                        [newPlans[idx+1], newPlans[idx]] = [newPlans[idx], newPlans[idx+1]];
                        setPricingPlans(newPlans);
                      }
                    }} style={{ cursor: 'pointer' }}>↓</button>
                    <button type="button" onClick={() => {
                      const newPlans = pricingPlans.filter((_, i) => i !== idx);
                      setPricingPlans(newPlans);
                    }} style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Remove Plan</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <input type="text" placeholder="Title (e.g. GST Registration)" value={plan.title || ''} onChange={(e) => { const np = [...pricingPlans]; np[idx].title = e.target.value; setPricingPlans(np); }} className={styles.inputField} />
                  <input type="text" placeholder="Price (e.g. ₹1,695)" value={plan.price || ''} onChange={(e) => { const np = [...pricingPlans]; np[idx].price = e.target.value; setPricingPlans(np); }} className={styles.inputField} />
                  <input type="text" placeholder="Period (e.g. / Year)" value={plan.period || ''} onChange={(e) => { const np = [...pricingPlans]; np[idx].period = e.target.value; setPricingPlans(np); }} className={styles.inputField} />
                  <input type="text" placeholder="Footnote (e.g. *Exclusive of Taxes)" value={plan.footnote || ''} onChange={(e) => { const np = [...pricingPlans]; np[idx].footnote = e.target.value; setPricingPlans(np); }} className={styles.inputField} />
                  <input type="text" placeholder="Button Text (e.g. Activate Now)" value={plan.buttonText || ''} onChange={(e) => { const np = [...pricingPlans]; np[idx].buttonText = e.target.value; setPricingPlans(np); }} className={styles.inputField} />
                  <input type="text" placeholder="Button Link (optional)" value={plan.buttonLink || ''} onChange={(e) => { const np = [...pricingPlans]; np[idx].buttonLink = e.target.value; setPricingPlans(np); }} className={styles.inputField} />
                </div>

                <div>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Features</strong>
                  {(plan.features || []).map((feat: any, fidx: number) => (
                    <div key={fidx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <input type="checkbox" checked={feat.included} onChange={(e) => { const np = [...pricingPlans]; np[idx].features[fidx].included = e.target.checked; setPricingPlans(np); }} title="Check if included" />
                      <input type="text" placeholder="Feature name" value={feat.name || ''} onChange={(e) => { const np = [...pricingPlans]; np[idx].features[fidx].name = e.target.value; setPricingPlans(np); }} className={styles.inputField} style={{ flexGrow: 1, margin: 0 }} />
                      <button type="button" onClick={() => { const np = [...pricingPlans]; np[idx].features = np[idx].features.filter((_: any, i: number) => i !== fidx); setPricingPlans(np); }} style={{ color: '#e53e3e', fontWeight: 'bold', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.5rem' }}>×</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => { const np = [...pricingPlans]; if(!np[idx].features) np[idx].features = []; np[idx].features.push({ name: '', included: true }); setPricingPlans(np); }} style={{ padding: '0.3rem 0.6rem', backgroundColor: 'var(--bg-primary)', color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>+ Add Feature</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setPricingPlans([...pricingPlans, { id: `plan-${Date.now()}`, title: '', price: '', period: '', footnote: '', features: [], buttonText: '', buttonLink: '' }])} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' }}>
              + Add Pricing Plan
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label>Custom Sections</label>
            {customSections.map((section, idx) => (
              <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Section {idx + 1}</strong>
                  <div style={{display: 'flex', gap: '0.5rem'}}>
                    <button type="button" onClick={() => {
                      if (idx > 0) {
                        const newSections = [...customSections];
                        [newSections[idx-1], newSections[idx]] = [newSections[idx], newSections[idx-1]];
                        setCustomSections(newSections);
                      }
                    }} style={{ cursor: 'pointer' }}>↑</button>
                    <button type="button" onClick={() => {
                      if (idx < customSections.length - 1) {
                        const newSections = [...customSections];
                        [newSections[idx+1], newSections[idx]] = [newSections[idx], newSections[idx+1]];
                        setCustomSections(newSections);
                      }
                    }} style={{ cursor: 'pointer' }}>↓</button>
                    <button type="button" onClick={() => {
                      const newSections = customSections.filter((_, i) => i !== idx);
                      setCustomSections(newSections);
                    }} style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Remove</button>
                  </div>
                </div>
                <input 
                  type="text" 
                  placeholder="Section Title"
                  value={section.title}
                  onChange={(e) => {
                    const newSections = [...customSections];
                    newSections[idx].title = e.target.value;
                    setCustomSections(newSections);
                  }}
                  className={styles.inputField} 
                  style={{ marginBottom: '0.5rem' }}
                />
                <RichTextEditor value={section.content} onChange={(val) => {
                  const newSections = [...customSections];
                  newSections[idx].content = val;
                  setCustomSections(newSections);
                }} />
              </div>
            ))}
            <button type="button" onClick={() => setCustomSections([...customSections, {title: '', content: ''}])} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
              + Add Custom Section
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label>FAQs</label>
            {faqs.map((faq, idx) => (
              <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>FAQ {idx + 1}</strong>
                  <button type="button" onClick={() => {
                    const newFaqs = faqs.filter((_, i) => i !== idx);
                    setFaqs(newFaqs);
                  }} style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Remove</button>
                </div>
                <input 
                  type="text" 
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => {
                    const newFaqs = [...faqs];
                    newFaqs[idx].question = e.target.value;
                    setFaqs(newFaqs);
                  }}
                  className={styles.inputField} 
                  style={{ marginBottom: '0.5rem' }}
                />
                <textarea 
                  rows={3}
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => {
                    const newFaqs = [...faqs];
                    newFaqs[idx].answer = e.target.value;
                    setFaqs(newFaqs);
                  }}
                  className={styles.inputField} 
                />
              </div>
            ))}
            <button type="button" onClick={() => setFaqs([...faqs, {question: '', answer: ''}])} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
              + Add FAQ
            </button>
          </div>

          {/* Process Steps (Section 8) */}
          <div className={styles.inputGroup}>
            <label>Process Steps (Section 8)</label>
            {processSteps.map((step, idx) => (
              <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Step {idx + 1}</strong>
                  <button type="button" onClick={() => {
                    const newSteps = processSteps.filter((_, i) => i !== idx);
                    setProcessSteps(newSteps);
                  }} style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Remove</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <select value={step.icon} onChange={(e) => {
                    const newSteps = [...processSteps];
                    newSteps[idx].icon = e.target.value;
                    setProcessSteps(newSteps);
                  }} className={styles.inputField}>
                    <option value="FileCheck">File Check</option>
                    <option value="FolderOpen">Folder</option>
                    <option value="Users">Users</option>
                    <option value="MonitorPlay">Monitor</option>
                    <option value="CheckCircle2">Checkmark</option>
                    <option value="Briefcase">Briefcase</option>
                  </select>
                  <input type="text" placeholder="Title" value={step.title} onChange={(e) => {
                    const newSteps = [...processSteps];
                    newSteps[idx].title = e.target.value;
                    setProcessSteps(newSteps);
                  }} className={styles.inputField} />
                </div>
                <textarea rows={2} placeholder="Description" value={step.desc} onChange={(e) => {
                  const newSteps = [...processSteps];
                  newSteps[idx].desc = e.target.value;
                  setProcessSteps(newSteps);
                }} className={styles.inputField} />
              </div>
            ))}
            <button type="button" onClick={() => setProcessSteps([...processSteps, {icon: 'FileCheck', title: '', desc: ''}])} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>+ Add Step</button>
          </div>

          {/* Process Benefits (Section 8) */}
          <div className={styles.inputGroup}>
            <label>Why It&apos;s Effortless (Section 8)</label>
            {processBenefits.map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input type="text" value={feat} onChange={(e) => {
                  const newFeatures = [...processBenefits];
                  newFeatures[idx] = e.target.value;
                  setProcessBenefits(newFeatures);
                }} className={styles.inputField} style={{ flexGrow: 1 }} />
                <button type="button" onClick={() => {
                  const newFeatures = processBenefits.filter((_, i) => i !== idx);
                  setProcessBenefits(newFeatures);
                }} style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', padding: '0 1rem', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
              </div>
            ))}
            <button type="button" onClick={() => setProcessBenefits([...processBenefits, ""])} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem', marginTop: '0.5rem' }}>+ Add Bullet</button>
          </div>

          {/* Benefits (Section 9) */}
          <div className={styles.inputGroup}>
            <label>Benefits (Section 9)</label>
            {benefits.map((benefit, idx) => (
              <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Benefit {idx + 1}</strong>
                  <button type="button" onClick={() => {
                    const newBens = benefits.filter((_, i) => i !== idx);
                    setBenefits(newBens);
                  }} style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Remove</button>
                </div>
                <input type="text" placeholder="Title" value={benefit.title} onChange={(e) => {
                  const newBens = [...benefits];
                  newBens[idx].title = e.target.value;
                  setBenefits(newBens);
                }} className={styles.inputField} style={{ marginBottom: '0.5rem' }} />
                <textarea rows={2} placeholder="Description" value={benefit.desc} onChange={(e) => {
                  const newBens = [...benefits];
                  newBens[idx].desc = e.target.value;
                  setBenefits(newBens);
                }} className={styles.inputField} />
              </div>
            ))}
            <button type="button" onClick={() => setBenefits([...benefits, {title: '', desc: ''}])} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>+ Add Benefit</button>
          </div>

          {/* Client Reviews (Section 11) */}
          <div className={styles.inputGroup}>
            <label>Client Reviews (Section 11)</label>
            {reviews.map((rev, idx) => (
              <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Review {idx + 1}</strong>
                  <button type="button" onClick={() => {
                    const newRevs = reviews.filter((_, i) => i !== idx);
                    setReviews(newRevs);
                  }} style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Remove</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="text" placeholder="Client Name" value={rev.name} onChange={(e) => {
                    const newRevs = [...reviews];
                    newRevs[idx].name = e.target.value;
                    setReviews(newRevs);
                  }} className={styles.inputField} />
                  <input type="text" placeholder="Type (e.g. Local Guide)" value={rev.type} onChange={(e) => {
                    const newRevs = [...reviews];
                    newRevs[idx].type = e.target.value;
                    setReviews(newRevs);
                  }} className={styles.inputField} />
                  <input type="text" placeholder="Date (e.g. 3 months ago)" value={rev.date} onChange={(e) => {
                    const newRevs = [...reviews];
                    newRevs[idx].date = e.target.value;
                    setReviews(newRevs);
                  }} className={styles.inputField} />
                  <input type="text" placeholder="Rating (e.g. 5.0)" value={rev.rating} onChange={(e) => {
                    const newRevs = [...reviews];
                    newRevs[idx].rating = e.target.value;
                    setReviews(newRevs);
                  }} className={styles.inputField} />
                </div>
                <textarea rows={3} placeholder="Review Text" value={rev.text} onChange={(e) => {
                  const newRevs = [...reviews];
                  newRevs[idx].text = e.target.value;
                  setReviews(newRevs);
                }} className={styles.inputField} />
              </div>
            ))}
            <button type="button" onClick={() => setReviews([...reviews, {name: '', type: 'Local Guide', date: 'Just now', text: '', rating: '5.0'}])} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>+ Add Review</button>
          </div>

          {/* Importance Cards (Section 12) */}
          <div className={styles.inputGroup}>
            <label>Importance Cards (Section 12)</label>
            {importanceCards.map((card, idx) => (
              <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Card {idx + 1}</strong>
                  <button type="button" onClick={() => {
                    const newCards = importanceCards.filter((_, i) => i !== idx);
                    setImportanceCards(newCards);
                  }} style={{ backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Remove</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <select value={card.icon} onChange={(e) => {
                    const newCards = [...importanceCards];
                    newCards[idx].icon = e.target.value;
                    setImportanceCards(newCards);
                  }} className={styles.inputField}>
                    <option value="IndianRupee">Rupee</option>
                    <option value="Wallet">Wallet</option>
                    <option value="Briefcase">Briefcase</option>
                    <option value="ShieldCheck">Shield</option>
                    <option value="CheckCircle2">Checkmark</option>
                  </select>
                  <input type="text" placeholder="Title" value={card.title} onChange={(e) => {
                    const newCards = [...importanceCards];
                    newCards[idx].title = e.target.value;
                    setImportanceCards(newCards);
                  }} className={styles.inputField} />
                </div>
                <textarea rows={2} placeholder="Description" value={card.desc} onChange={(e) => {
                  const newCards = [...importanceCards];
                  newCards[idx].desc = e.target.value;
                  setImportanceCards(newCards);
                }} className={styles.inputField} />
              </div>
            ))}
            <button type="button" onClick={() => setImportanceCards([...importanceCards, {icon: 'IndianRupee', title: '', desc: ''}])} style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>+ Add Card</button>
          </div>
          <div className={styles.inputGroup} style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
              <label style={{ marginBottom: 0 }}>Rich Content (HTML/Markdown)</label>
              <button 
                type="button" 
                onClick={handleGenerateDetailsAI} 
                disabled={isGeneratingDetails || !serviceName}
                style={{ 
                  background: 'linear-gradient(135deg, #10b981, #059669)', 
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
                {isGeneratingDetails ? "Generating..." : "✨ AI Generate Detailed Info"}
              </button>
            </div>
            <RichTextEditor value={serviceContent} onChange={setServiceContent} />
          </div>
          <div className={styles.inputGroup}>
            <label>Period</label>
            <select value={servicePeriod} onChange={(e) => setServicePeriod(e.target.value)} className={styles.inputField}>
              <option value="one-time">One-time</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
              <label style={{ marginBottom: 0 }}>Custom SEO Meta Title (Optional)</label>
              <button 
                type="button" 
                onClick={handleOptimizeSEO} 
                disabled={isOptimizing || (!serviceContent && !serviceDescription)}
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
            <input 
              type="text" 
              placeholder="Custom SEO Title" 
              className={styles.inputField} 
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Custom SEO Meta Description (Optional)</label>
            <textarea 
              rows={3} 
              placeholder="Custom SEO Description..." 
              className={styles.inputField} 
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>SEO Keywords (Comma-separated)</label>
            <input 
              type="text" 
              placeholder="e.g. business registration, tax filing" 
              className={styles.inputField} 
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Custom Schema (JSON-LD) (Optional)</label>
            <textarea 
              rows={4} 
              placeholder='{"@context": "https://schema.org", "@type": "Service", ...}' 
              className={styles.inputField} 
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              value={customSchema}
              onChange={(e) => setCustomSchema(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup} style={{flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
            <input type="checkbox" id="isCombo" checked={isCombo} onChange={(e) => setIsCombo(e.target.checked)} style={{width: '18px', height: '18px'}} />
            <label htmlFor="isCombo" style={{fontWeight: 600}}>Is this a Combo Service?</label>
          </div>
          <div className={styles.inputGroup} style={{flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
            <input type="checkbox" id="isPublished" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} style={{width: '18px', height: '18px'}} />
            <label htmlFor="isPublished" style={{fontWeight: 600}}>Publish Service</label>
          </div>
          <div className={styles.inputGroup} style={{flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
            <input type="checkbox" id="showReviews" checked={showReviews} onChange={(e) => setShowReviews(e.target.checked)} style={{width: '18px', height: '18px'}} />
            <label htmlFor="showReviews" style={{fontWeight: 600}}>Show Reviews Section</label>
          </div>

          <div className={styles.inputGroup} style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '1rem', color: 'var(--text-color)' }}>
            <label style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'block', color: 'var(--text-color)', fontWeight: 'bold' }}>Section Visibility Settings</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {Object.keys(visibility).map(key => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id={`vis-${key}`} 
                    checked={visibility[key]} 
                    onChange={(e) => setVisibility({ ...visibility, [key]: e.target.checked })} 
                    style={{ width: '16px', height: '16px' }} 
                  />
                  <label htmlFor={`vis-${key}`} style={{ fontSize: '0.9rem', textTransform: 'capitalize', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          {isCombo && (
            <div className={styles.inputGroup} style={{padding: '1rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px'}}>
              <label style={{marginBottom: '0.75rem', display: 'block', fontWeight: 600}}>Select Included Services</label>
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto'}}>
                {servicesList.filter(s => !s.isCombo && s.id !== editingId).map(s => (
                  <div key={s.id} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <input 
                      type="checkbox" 
                      id={`combo-${s.id}`}
                      checked={comboServices.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setComboServices([...comboServices, s.id]);
                        } else {
                          setComboServices(comboServices.filter(id => id !== s.id));
                        }
                      }}
                      style={{width: '16px', height: '16px'}}
                    />
                    <label htmlFor={`combo-${s.id}`}>{s.name} <span style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>({s.category})</span></label>
                  </div>
                ))}
                {servicesList.filter(s => !s.isCombo && s.id !== editingId).length === 0 && (
                  <p style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>No standard services available to bundle.</p>
                )}
              </div>
            </div>
          )}
          <div style={{display: 'flex', gap: '1rem', marginTop: '0.5rem'}}>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (editingId ? "Update Service" : "Add Service")}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className={styles.submitBtn} style={{backgroundColor: '#64748b'}}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>Existing Services</h2>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
          {servicesList.length === 0 ? <p style={{color: '#64748b'}}>No services found.</p> : null}
          {servicesList.map(s => (
            <div key={s.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px'}}>
              <div>
                <strong style={{fontSize: '1.1rem'}}>{s.name} {s.isCombo && <span style={{backgroundColor: '#e0e7ff', color: '#4338ca', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '0.5rem', verticalAlign: 'middle'}}>COMBO</span>}</strong> 
                <div style={{fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem'}}>
                  {s.category} • <span style={{textTransform: 'capitalize'}}>{s.period}</span> {s.isRecurring ? '(Recurring)' : ''} • Price: ₹{s.price || 0} • <strong>Slug:</strong> {s.slug}
                </div>
                {s.documentsRequired && (
                  <div style={{fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem'}}>
                    <strong>Docs Required:</strong> {Array.isArray(s.documentsRequired) ? s.documentsRequired.join(", ") : s.documentsRequired}
                  </div>
                )}
              </div>
              <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end'}}>
                <button onClick={() => togglePublishStatus(s.id, s.isPublished !== false)} style={{color: s.isPublished !== false ? '#d97706' : '#10b981', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600}}>
                  {s.isPublished !== false ? "Unpublish" : "Publish"}
                </button>
                <button onClick={() => handleEdit(s)} style={{color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  <Edit2 size={16}/> Edit
                </button>
                <button onClick={() => deleteService(s.id)} style={{color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                  <Trash2 size={16}/> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
