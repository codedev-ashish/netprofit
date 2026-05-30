"use client";

import { useState, useEffect } from "react";
import styles from "../page.module.css";
import { db } from "../../../../src/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Trash2, Edit2 } from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

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
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [serviceFeatures, setServiceFeatures] = useState<string[]>(["Professional Assistance", "100% Online Process", "Dedicated Support", "Secure Payment"]);
  const [serviceContent, setServiceContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }, { 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
    table: true
  };

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
      isCombo: isCombo,
      comboServices: isCombo ? comboServices : [],
      price: servicePrice,
      features: serviceFeatures,
      content: serviceContent,
      isPublished: isPublished,
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
    setIsCombo(s.isCombo || false);
    setComboServices(s.comboServices || []);
    setServicePrice(s.price || 0);
    setServiceFeatures(s.features || ["Professional Assistance", "100% Online Process", "Dedicated Support", "Secure Payment"]);
    setServiceContent(s.content || "");
    setIsPublished(s.isPublished !== false);
  };

  const resetForm = () => {
    setEditingId(null);
    setServiceName("");
    setSlug("");
    setServiceDescription("");
    setServiceDocumentsRequired([]);
    setServiceRecurring(false);
    setIsCombo(false);
    setComboServices([]);
    setServicePeriod("one-time");
    setServiceCategory("Registration");
    setServicePrice(0);
    setServiceFeatures(["Professional Assistance", "100% Online Process", "Dedicated Support", "Secure Payment"]);
    setServiceContent("");
    setIsPublished(true);
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
          <div className={styles.inputGroup} style={{ paddingBottom: '2rem' }}>
            <label>Description</label>
            <div style={{ background: 'white', color: 'black' }}>
              <ReactQuill 
                theme="snow" 
                value={serviceDescription} 
                onChange={setServiceDescription} 
                modules={quillModules}
                style={{ height: '150px', marginBottom: '3rem' }} 
              />
            </div>
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
          <div className={styles.inputGroup}>
            <label>Price</label>
            <input type="number" value={servicePrice} onChange={(e) => setServicePrice(parseFloat(e.target.value))} required className={styles.inputField} min="0" step="0.01" />
          </div>
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
          <div className={styles.inputGroup} style={{ paddingBottom: '2rem' }}>
            <label>Rich Content (HTML/Markdown)</label>
            <div style={{ background: 'white', color: 'black' }}>
              <ReactQuill 
                theme="snow" 
                value={serviceContent} 
                onChange={setServiceContent} 
                modules={quillModules}
                style={{ height: '300px', marginBottom: '3rem' }} 
              />
            </div>
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
          <div className={styles.inputGroup} style={{flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
            <input type="checkbox" id="recurring" checked={serviceRecurring} onChange={(e) => setServiceRecurring(e.target.checked)} style={{width: '18px', height: '18px'}} />
            <label htmlFor="recurring">Is Recurring Subscription?</label>
          </div>
          <div className={styles.inputGroup} style={{flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
            <input type="checkbox" id="isCombo" checked={isCombo} onChange={(e) => setIsCombo(e.target.checked)} style={{width: '18px', height: '18px'}} />
            <label htmlFor="isCombo" style={{fontWeight: 600}}>Is this a Combo Service?</label>
          </div>
          <div className={styles.inputGroup} style={{flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
            <input type="checkbox" id="isPublished" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} style={{width: '18px', height: '18px'}} />
            <label htmlFor="isPublished" style={{fontWeight: 600}}>Publish Service</label>
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
