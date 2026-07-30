"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Mail, MailOpen, Trash2, Calendar, Phone, CheckCircle, Briefcase, MapPin } from "lucide-react";

interface ExpertHelpMessage {
  id: string;
  name: string;
  phone: string;
  service: string;
  location: string;
  status: string; // 'new', 'contacted', 'resolved'
  createdAt: any;
}

export default function AdminExpertHelpPage() {
  const [messages, setMessages] = useState<ExpertHelpMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<ExpertHelpMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, "expert_help_inquiries"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const items: ExpertHelpMessage[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ExpertHelpMessage);
      });
      setMessages(items);
    } catch (error) {
      console.error("Error fetching expert help inquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "expert_help_inquiries", id), {
        status: newStatus
      });
      fetchMessages();
      if (selectedMsg && selectedMsg.id === id) {
        setSelectedMsg({ ...selectedMsg, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    try {
      await deleteDoc(doc(db, "expert_help_inquiries", id));
      setMessages(messages.filter(m => m.id !== id));
      if (selectedMsg?.id === id) setSelectedMsg(null);
    } catch (error) {
      console.error("Error deleting inquiry:", error);
      alert("Failed to delete inquiry.");
    }
  };

  const openMessage = async (msg: ExpertHelpMessage) => {
    setSelectedMsg(msg);
    if (msg.status === 'new') {
      handleUpdateStatus(msg.id, 'contacted');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading inquiries...</div>;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.25rem' }}>Expert Help Inquiries</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage leads from the Service page "Expert Help" form</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 180px)', minHeight: '600px' }}>
        {/* Left Sidebar - Message List */}
        <div style={{ 
          flex: '0 0 380px', 
          background: 'var(--bg-secondary)', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ 
            padding: '1.25rem', 
            borderBottom: '1px solid var(--border-color)', 
            background: 'rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>All Inquiries</span>
            {messages.filter(m => m.status === 'new').length > 0 && (
              <span style={{ 
                background: 'var(--primary-color)', 
                color: 'white', 
                fontSize: '0.75rem', 
                padding: '2px 8px', 
                borderRadius: '12px', 
                fontWeight: 'bold' 
              }}>
                {messages.filter(m => m.status === 'new').length} New
              </span>
            )}
          </div>
          
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--border-color) transparent'
          }}>
            {messages.length === 0 ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Phone size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No inquiries yet.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isSelected = selectedMsg?.id === msg.id;
                const isNew = msg.status === 'new';
                return (
                  <div 
                    key={msg.id} 
                    onClick={() => openMessage(msg)}
                    style={{ 
                      padding: '1.25rem', 
                      borderBottom: '1px solid var(--border-color)', 
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255,255,255,0.05)' : isNew ? 'rgba(249, 115, 22, 0.03)' : 'transparent',
                      position: 'relative',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = isNew ? 'rgba(249, 115, 22, 0.03)' : 'transparent' }}
                  >
                    {isNew && (
                      <div style={{ position: 'absolute', left: '0', top: '0', bottom: '0', width: '3px', background: 'var(--primary-color)' }} />
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        {isNew && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0 }} />}
                        <strong style={{ 
                          fontSize: '0.95rem', 
                          color: isSelected ? 'var(--primary-color)' : isNew ? 'var(--text-color)' : 'white',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {msg.name}
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '0.5rem' }}>
                        {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'New'}
                      </span>
                    </div>
                    
                    <div style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: isNew ? 600 : 500, 
                      color: isNew ? 'var(--text-color)' : 'var(--text-muted)', 
                      marginBottom: '0.35rem', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      Service: {msg.service}
                    </div>
                    
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-muted)', 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      opacity: 0.8
                    }}>
                      {msg.phone} - {msg.location}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane - Message Detail View */}
        <div style={{ 
          flex: 1, 
          background: 'var(--bg-secondary)', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)', 
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden'
        }}>
          {selectedMsg ? (
            <>
              {/* Detail Header */}
              <div style={{ 
                padding: '2rem 2.5rem', 
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.1)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-color)', margin: 0, lineHeight: 1.3 }}>
                    Inquiry for: {selectedMsg.service}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button 
                      onClick={() => handleUpdateStatus(selectedMsg.id, selectedMsg.status === 'resolved' ? 'contacted' : 'resolved')} 
                      style={{ 
                        background: selectedMsg.status === 'resolved' ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-color)', 
                        border: selectedMsg.status === 'resolved' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-color)', 
                        padding: '0.6rem', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        color: selectedMsg.status === 'resolved' ? '#22c55e' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="Toggle Resolved Status"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedMsg.id)} 
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                        padding: '0.6rem', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      title="Delete inquiry"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sender Info Card */}
              <div style={{ padding: '0 2.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem', 
                  padding: '1.5rem 0',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    background: 'var(--primary-color)', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {selectedMsg.name.charAt(0)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>
                        {selectedMsg.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <Calendar size={14} />
                        {selectedMsg.createdAt?.toDate ? new Date(selectedMsg.createdAt.toDate()).toLocaleString() : 'Unknown date'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-color)', fontSize: '0.9rem' }}>
                        <Phone size={14} style={{ color: 'var(--primary-color)' }} />
                        <a href={`tel:${selectedMsg.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {selectedMsg.phone}
                        </a>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <MapPin size={14} />
                        {selectedMsg.location || 'No location provided'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div style={{ 
                padding: '2.5rem', 
                flex: 1, 
                overflowY: 'auto',
                color: 'var(--text-color)',
                lineHeight: 1.6,
                fontSize: '1.05rem',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--border-color) transparent'
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Requested</h4>
                  <p style={{ margin: 0, fontWeight: 500 }}>{selectedMsg.service}</p>
                </div>
                
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</h4>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '0.35rem 0.75rem', 
                    background: selectedMsg.status === 'resolved' ? 'rgba(34, 197, 94, 0.1)' : selectedMsg.status === 'contacted' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                    color: selectedMsg.status === 'resolved' ? '#22c55e' : selectedMsg.status === 'contacted' ? '#3b82f6' : '#f97316',
                    borderRadius: '30px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {selectedMsg.status}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', opacity: 0.5 }}>
              <Phone size={64} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.1rem' }}>Select an inquiry to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
