"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "../../../lib/firebase";
import { collection, query, orderBy, onSnapshot, getDocs, addDoc, serverTimestamp, setDoc, doc, where } from "firebase/firestore";
import { Send, UserCircle } from "lucide-react";
import styles from "./page.module.css";

interface ChatSession {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  updatedAt: any;
  unreadByAdmin: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: any;
  isAdmin: boolean;
}

export default function AdminChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen to all chat sessions
    const q = query(collection(db, "chat_sessions"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sess: ChatSession[] = [];
      snapshot.forEach((doc) => {
        sess.push(doc.data() as ChatSession);
      });
      setSessions(sess);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeSession) {
      setMessages([]);
      return;
    }

    // Mark as read when opening
    if (activeSession.unreadByAdmin) {
      setDoc(doc(db, "chat_sessions", activeSession.userId), {
        unreadByAdmin: false
      }, { merge: true }).catch(console.error);
    }

    // Listen to messages for the active session
    const q = query(
      collection(db, "chats"),
      where("userId", "==", activeSession.userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [activeSession?.userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSession) return;

    try {
      await addDoc(collection(db, "chats"), {
        userId: activeSession.userId,
        senderId: "admin",
        senderName: "Admin Support",
        message: newMessage.trim(),
        isAdmin: true,
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, "chat_sessions", activeSession.userId), {
        lastMessage: "You: " + newMessage.trim(),
        updatedAt: serverTimestamp(),
        unreadByAdmin: false
      }, { merge: true });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className={styles.chatContainer}>
      {/* Sidebar: Session List */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Active Chats</h2>
        </div>
        <div className={styles.sessionList}>
          {sessions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No chat sessions yet.
            </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.userId} 
                className={`${styles.sessionItem} ${activeSession?.userId === session.userId ? styles.sessionItemActive : ''}`}
                onClick={() => setActiveSession(session)}
              >
                <div className={styles.sessionHeader}>
                  <span className={styles.sessionName}>{session.userName || "User"}</span>
                  <span className={styles.sessionDate}>
                    {session.updatedAt ? (typeof session.updatedAt.toDate === 'function' ? session.updatedAt.toDate().toLocaleDateString() : '') : ''}
                  </span>
                </div>
                <div className={styles.sessionPreview}>
                  {session.lastMessage}
                </div>
                {session.unreadByAdmin && activeSession?.userId !== session.userId && (
                  <div className={styles.unreadDot} />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.chatArea}>
        {!activeSession ? (
          <div className={styles.emptyState}>
            <div>
              <UserCircle size={48} style={{ margin: '0 auto', display: 'block', marginBottom: '1rem', color: 'var(--border-color)' }} />
              Select a chat session to start messaging.
            </div>
          </div>
        ) : (
          <>
            <div className={styles.chatHeader}>
              <h2>{activeSession.userName || "User"}</h2>
              <p>{activeSession.userEmail}</p>
            </div>
            
            <div ref={messagesContainerRef} className={styles.messagesList}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                  No messages found for this user.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.isAdmin;
                  return (
                    <div 
                      key={msg.id} 
                      className={styles.messageWrapper}
                      style={{ alignSelf: isMe ? 'flex-end' : 'flex-start' }}
                    >
                      <div 
                        className={styles.messageMeta}
                        style={{ textAlign: isMe ? 'right' : 'left' }}
                      >
                        {msg.senderName} • {msg.createdAt ? (typeof msg.createdAt.toDate === 'function' ? msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '') : ''}
                      </div>
                      <div 
                        className={styles.messageBubble}
                        style={{ 
                          background: isMe ? 'var(--primary-color)' : 'var(--bg-secondary)',
                          color: isMe ? 'white' : 'var(--text-color)',
                          borderBottomRightRadius: isMe ? 0 : '12px',
                          borderBottomLeftRadius: !isMe ? 0 : '12px'
                        }}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.inputArea}>
              <form onSubmit={handleSendMessage} className={styles.chatForm}>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Reply to ${activeSession.userName}...`}
                  className={styles.inputField}
                  autoFocus
                />
                <button type="submit" disabled={!newMessage.trim()} className={styles.sendBtn}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
