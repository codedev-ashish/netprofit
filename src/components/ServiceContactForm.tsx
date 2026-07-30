"use client";

import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { User, Phone, Briefcase, MapPin } from "lucide-react";

export default function ServiceContactForm({ serviceName }: { serviceName: string }) {
  const [formData, setFormData] = useState({ name: "", phone: "", service: serviceName, location: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "expert_help_inquiries"), {
        ...formData,
        createdAt: serverTimestamp(),
        status: "new"
      });
      setSubmitted(true);
      setFormData({ name: "", phone: "", service: serviceName, location: "" });
    } catch (error) {
      console.error("Error submitting contact form: ", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', color: '#1e293b', padding: '1rem 0' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>Thank You!</h3>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>We have received your inquiry. Our expert will contact you shortly.</p>
        <button onClick={() => setSubmitted(false)} style={{ marginTop: '1.5rem', background: '#f1f5f9', border: 'none', color: '#475569', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Submit Another</button>
      </div>
    );
  }

  const inputWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '24px',
    padding: '0 1.25rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset',
    marginBottom: '1.25rem'
  };

  const iconStyle = {
    color: '#ea580c',
    marginRight: '0.75rem',
    flexShrink: 0
  };

  const inputStyle = {
    width: '100%',
    padding: '1rem 0',
    border: 'none',
    background: 'transparent',
    color: '#1e293b',
    fontSize: '0.95rem',
    outline: 'none',
    fontWeight: 500
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
      
      <div style={inputWrapperStyle}>
        <User size={18} style={iconStyle} />
        <input 
          type="text" 
          name="name"
          placeholder="Full Name" 
          required 
          value={formData.name}
          onChange={handleChange}
          style={inputStyle} 
        />
      </div>

      <div style={inputWrapperStyle}>
        <Phone size={18} style={iconStyle} />
        <input 
          type="tel" 
          name="phone"
          placeholder="Mobile Number" 
          required 
          value={formData.phone}
          onChange={handleChange}
          style={inputStyle} 
        />
      </div>

      <div style={inputWrapperStyle}>
        <Briefcase size={18} style={iconStyle} />
        <input 
          type="text" 
          name="service"
          placeholder="Select Service" 
          value={formData.service}
          onChange={handleChange}
          style={inputStyle} 
        />
      </div>

      <div style={inputWrapperStyle}>
        <MapPin size={18} style={iconStyle} />
        <input 
          type="text" 
          name="location"
          placeholder="City / Pincode / State" 
          value={formData.location}
          onChange={handleChange}
          style={inputStyle} 
        />
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        style={{ 
          width: '100%', 
          padding: '1rem', 
          borderRadius: '30px', 
          border: 'none', 
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', 
          color: 'white', 
          fontWeight: 800, 
          fontSize: '1.1rem',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          transition: 'transform 0.1s, filter 0.2s',
          boxShadow: '0 8px 20px rgba(234, 88, 12, 0.3)',
          marginTop: '0.5rem'
        }}
        onMouseOver={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
        onMouseOut={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
      >
        {isSubmitting ? "Submitting..." : "Talk to Expert (Free)"}
      </button>
    </form>
  );
}
