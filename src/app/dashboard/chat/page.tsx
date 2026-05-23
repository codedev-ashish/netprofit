"use client";

import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "../../../lib/firebase";
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Send } from "lucide-react";
import styles from "../page.module.css";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: any;
  isAdmin: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Set up real-time listener for this user's chat
        const q = query(
          collection(db, "chats"), 
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "asc")
        );
        
        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const msgs: ChatMessage[] = [];
          snapshot.forEach((doc) => {
            msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
          });
          setMessages(msgs);
          setTimeout(() => scrollToBottom(), 100);
        });

        return () => unsubscribeSnapshot();
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await addDoc(collection(db, "chats"), {
        userId: user.uid,
        senderId: user.uid,
        senderName: user.email?.split('@')[0] || "User",
        message: newMessage.trim(),
        isAdmin: false,
        createdAt: serverTimestamp()
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <h1 className={styles.title} style={{ marginBottom: '1rem' }}>Chat with Admin</h1>
      
      <div className="cleartax-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
              <p>No messages yet. Send a message to start a conversation with our support team!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textAlign: isMe ? 'right' : 'left' }}>
                    {msg.senderName} • {msg.createdAt ? (typeof msg.createdAt.toDate === 'function' ? msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '') : ''}
                  </div>
                  <div style={{ 
                    padding: '0.75rem 1rem', 
                    borderRadius: '12px',
                    background: isMe ? 'var(--primary-color)' : 'var(--bg-secondary)',
                    color: isMe ? 'white' : 'var(--text-color)',
                    borderBottomRightRadius: isMe ? 0 : '12px',
                    borderBottomLeftRadius: !isMe ? 0 : '12px'
                  }}>
                    {msg.message}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '24px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)' }}
            />
            <button type="submit" disabled={!newMessage.trim()} className="btn btn-primary" style={{ borderRadius: '50%', width: '45px', height: '45px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
