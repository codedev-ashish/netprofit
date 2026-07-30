"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "../../../lib/firebase";
import { auth } from "../../../lib/firebase-auth";
import { collection, query, where, orderBy, getDocs, addDoc, setDoc, doc, serverTimestamp, onSnapshot, getDoc } from "firebase/firestore";
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
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch user data to check if chat is disabled
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: currentUser.uid, ...userDoc.data() });
        } else {
          setUser(currentUser);
        }

        // Clean up any existing listener before creating a new one
        if (unsubscribeSnapshot) unsubscribeSnapshot();

        // Set up real-time listener for this user's chat
        const q = query(
          collection(db, "chats"), 
          where("userId", "==", currentUser.uid)
        );
        
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const msgs: ChatMessage[] = [];
          snapshot.forEach((doc) => {
            msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
          });

          // Sort messages by createdAt locally to avoid requiring a composite index
          msgs.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeA - timeB;
          });

          setMessages(msgs);
          setTimeout(() => scrollToBottom(), 100);
        });
      } else {
        // Unsubscribe if user logs out
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
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

      await setDoc(doc(db, "chat_sessions", user.uid), {
        userId: user.uid,
        userName: user.email?.split('@')[0] || "User",
        userEmail: user.email,
        lastMessage: newMessage.trim(),
        updatedAt: serverTimestamp(),
        unreadByAdmin: true
      }, { merge: true });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <h1 className={styles.title} style={{ marginBottom: '1rem' }}>Chat with Admin</h1>
      
      {user?.chatDisabled ? (
        <div className="cleartax-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <h3>Chat Disabled</h3>
            <p style={{ marginTop: '0.5rem' }}>Your chat access has been disabled by an administrator.</p>
          </div>
        </div>
      ) : (
        <div className="cleartax-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
      )}
    </div>
  );
}
