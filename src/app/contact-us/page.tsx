"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { Send, MapPin, Phone, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [contactInfo, setContactInfo] = useState({
    address: "",
    mobile: "",
    email: "",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      whatsapp: "",
      telegram: ""
    }
  });

  const [pageData, setPageData] = useState<{ title: string; content: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setContactInfo({
            address: data.address || "",
            mobile: data.mobile || "",
            email: data.email || "",
            socialLinks: data.socialLinks || { facebook: "", twitter: "", instagram: "", linkedin: "", whatsapp: "", telegram: "" }
          });
        }

        // Fetch or create page content for admin editability
        const pageRef = doc(db, "pages", "contact-us");
        const pageSnap = await getDoc(pageRef);
        if (pageSnap.exists()) {
          setPageData({
            title: pageSnap.data().title,
            content: pageSnap.data().content
          });
        } else {
          // Self-seed the database so it appears in the admin panel
          const defaultData = {
            title: "Contact Us",
            slug: "contact-us",
            content: "<p>Have a question or need assistance? Fill out the form below, and our team will get back to you as soon as possible.</p>",
            isPublished: true,
            createdAt: serverTimestamp()
          };
          await setDoc(pageRef, defaultData);
          setPageData({ title: defaultData.title, content: defaultData.content });
        }
      } catch (err) {
        console.error("Error fetching contact settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setStatus("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>{pageData?.title || "Get in Touch"}</h1>
        {pageData?.content ? (
          <div
            className={styles.subtitle}
            dangerouslySetInnerHTML={{ __html: pageData.content.replace(/http:\/\//gi, 'https://') }}
          />
        ) : (
          <p className={styles.subtitle}>
            Have a question or need assistance? Fill out the form below, and our team will get back to you as soon as possible.
          </p>
        )}
      </div>

      <div className={styles.contentWrapper}>

        {/* Contact Information */}
        <div className={styles.infoSection}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-color)' }}>Contact Information</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '12px', borderRadius: '50%' }}>
                <MapPin size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-color)' }}>Office Address</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {contactInfo.address}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '12px', borderRadius: '50%' }}>
                <Phone size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-color)' }}>Phone Number</h3>
                <p style={{ color: 'var(--text-muted)' }}>{contactInfo.mobile}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '12px', borderRadius: '50%' }}>
                <Mail size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-color)' }}>Email Address</h3>
                <p style={{ color: 'var(--text-muted)' }}>{contactInfo.email}</p>
              </div>
            </div>

            {/* Social Links */}
            {(contactInfo.socialLinks.facebook || contactInfo.socialLinks.twitter || contactInfo.socialLinks.instagram || contactInfo.socialLinks.linkedin || contactInfo.socialLinks.whatsapp || contactInfo.socialLinks.telegram) && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-color)' }}>Connect with Us</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {contactInfo.socialLinks.facebook && (
                    <a href={contactInfo.socialLinks.facebook} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#1877F2', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="Facebook">
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                    </a>
                  )}
                  {contactInfo.socialLinks.twitter && (
                    <a href={contactInfo.socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#000000', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="X (Twitter)">
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
                    </a>
                  )}
                  {contactInfo.socialLinks.instagram && (
                    <a href={contactInfo.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="Instagram">
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    </a>
                  )}
                  {contactInfo.socialLinks.linkedin && (
                    <a href={contactInfo.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#0A66C2', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="LinkedIn">
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                    </a>
                  )}
                  {contactInfo.socialLinks.whatsapp && (
                    <a href={contactInfo.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#25D366', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="WhatsApp">
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    </a>
                  )}
                  {contactInfo.socialLinks.telegram && (
                    <a href={contactInfo.socialLinks.telegram} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', background: '#0088cc', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'} title="Telegram">
                      <Send size={20} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Form */}
        <div className={styles.formSection}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-color)' }}>Send us a Message</h2>

          {status === 'success' ? (
            <div style={{ background: '#dcfce7', color: '#166534', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
              <CheckCircle2 size={48} style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Message Sent!</h3>
              <p>Thank you for reaching out. We will get back to you shortly.</p>
              <button
                onClick={() => setStatus('idle')}
                style={{ marginTop: '1.5rem', background: '#166534', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {status === 'error' && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={20} />
                  {errorMessage}
                </div>
              )}

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>Full Name <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)' }}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>Email Address <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)' }}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="phone" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>WhatsApp Number <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)' }}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="subject" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>Subject <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)' }}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>Message <span style={{ color: 'red' }}>*</span></label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-color)', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  marginTop: '1rem',
                  padding: '0.875rem',
                  background: 'var(--primary-color, #2563eb)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: status === 'loading' ? 0.7 : 1
                }}
              >
                {status === 'loading' ? 'Sending...' : 'Send Message'}
                {!status && <Send size={18} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
