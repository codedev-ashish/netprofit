"use client";

import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { Mail, MailOpen, Trash2, Calendar, Phone, CheckCircle } from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export default function AdminInquiriesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, "contact_messages"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const items: ContactMessage[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ContactMessage);
      });
      setMessages(items);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "contact_messages", id), {
        read: !currentStatus
      });
      fetchMessages();
      if (selectedMsg && selectedMsg.id === id) {
        setSelectedMsg({ ...selectedMsg, read: !currentStatus });
      }
    } catch (error) {
      console.error("Error updating read status:", error);
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteDoc(doc(db, "contact_messages", id));
      setMessages(messages.filter(m => m.id !== id));
      if (selectedMsg?.id === id) setSelectedMsg(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message.");
    }
  };

  const openMessage = async (msg: ContactMessage) => {
    setSelectedMsg(msg);
    if (!msg.read) {
      handleMarkAsRead(msg.id, false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading messages...</div>;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-color)', marginBottom: '0.25rem' }}>Inbox</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage your contact form inquiries</p>
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
            <span style={{ fontWeight: 600, color: 'var(--text-color)' }}>All Messages</span>
            {messages.filter(m => !m.read).length > 0 && (
              <span style={{ 
                background: 'var(--primary-color)', 
                color: 'white', 
                fontSize: '0.75rem', 
                padding: '2px 8px', 
                borderRadius: '12px', 
                fontWeight: 'bold' 
              }}>
                {messages.filter(m => !m.read).length} New
              </span>
            )}
          </div>
          
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            /* Custom scrollbar styles */
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--border-color) transparent'
          }}>
            {messages.length === 0 ? (
              <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Mail size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No messages yet.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isSelected = selectedMsg?.id === msg.id;
                return (
                  <div 
                    key={msg.id} 
                    onClick={() => openMessage(msg)}
                    style={{ 
                      padding: '1.25rem', 
                      borderBottom: '1px solid var(--border-color)', 
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(255,255,255,0.05)' : msg.read ? 'transparent' : 'rgba(249, 115, 22, 0.03)',
                      position: 'relative',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = msg.read ? 'transparent' : 'rgba(249, 115, 22, 0.03)' }}
                  >
                    {!msg.read && (
                      <div style={{ position: 'absolute', left: '0', top: '0', bottom: '0', width: '3px', background: 'var(--primary-color)' }} />
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                        {!msg.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', flexShrink: 0 }} />}
                        <strong style={{ 
                          fontSize: '0.95rem', 
                          color: isSelected ? 'var(--primary-color)' : msg.read ? 'var(--text-color)' : 'white',
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
                      fontWeight: msg.read ? 500 : 600, 
                      color: msg.read ? 'var(--text-muted)' : 'var(--text-color)', 
                      marginBottom: '0.35rem', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      {msg.subject}
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
                      {msg.message}
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
                    {selectedMsg.subject}
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button 
                      onClick={() => handleMarkAsRead(selectedMsg.id, selectedMsg.read)} 
                      style={{ 
                        background: 'var(--bg-color)', 
                        border: '1px solid var(--border-color)', 
                        padding: '0.6rem', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-color)'; e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                      title={selectedMsg.read ? "Mark as unread" : "Mark as read"}
                    >
                      {selectedMsg.read ? <Mail size={18} /> : <MailOpen size={18} />}
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
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                      title="Delete message"
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
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-color)' }}>{selectedMsg.name}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <Calendar size={14} /> 
                        {selectedMsg.createdAt?.toDate ? new Date(selectedMsg.createdAt.toDate()).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }) : 'Just now'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        <a href={`mailto:${selectedMsg.email}`} style={{ color: 'var(--icon-color)', textDecoration: 'none' }}>{selectedMsg.email}</a>
                      </span>
                      {selectedMsg.phone && (
                        <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Phone size={12} /> <a href={`tel:${selectedMsg.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{selectedMsg.phone}</a>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div style={{ 
                flex: 1, 
                padding: '2.5rem', 
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--border-color) transparent'
              }}>
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: '1.8', 
                  color: 'var(--text-color)', 
                  fontSize: '1.05rem',
                  maxWidth: '800px'
                }}>
                  {selectedMsg.message}
                </div>
                
                <div style={{ marginTop: '3rem' }}>
                  <a 
                    href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject}`}
                    className="btn btn-primary"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      borderRadius: '8px'
                    }}
                  >
                    <Mail size={16} /> Reply via Email
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              color: 'var(--text-muted)',
              background: 'rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                background: 'var(--bg-color)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '1.5rem',
                border: '1px solid var(--border-color)'
              }}>
                <MailOpen size={36} style={{ opacity: 0.5 }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-color)', marginBottom: '0.5rem' }}>Your Inbox</h3>
              <p>Select a message from the list to view its contents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
