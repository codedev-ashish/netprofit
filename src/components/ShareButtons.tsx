"use client";

import { useState, useEffect } from "react";
import { Link2, Share2, Send } from "lucide-react";

export default function ShareButtons({ title, text, url }: { title?: string, text?: string, url?: string }) {
  const [currentUrl, setCurrentUrl] = useState(url || "");
  const [shareTitle, setShareTitle] = useState(title || "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!url) setCurrentUrl(window.location.href);
    if (!title) setShareTitle(document.title);
  }, [url, title]);

  const shareText = text || "Check this out!";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: currentUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      alert("Web Share API is not supported in your browser.");
    }
  };

  const socialLinks = [
    {
      name: "WhatsApp",
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + " " + currentUrl)}`,
      color: "#25D366"
    },
    {
      name: "X (Twitter)",
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`,
      color: "var(--text-color)"
    },
    {
      name: "Facebook",
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      color: "#1877F2"
    },
    {
      name: "LinkedIn",
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
      color: "#0A66C2"
    },
    {
      name: "Telegram",
      icon: <Send size={20} />,
      url: `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareTitle)}`,
      color: "#0088cc"
    },
    {
      name: "Reddit",
      icon: <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0"></path><path d="M16 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0"></path><path d="M9 16a5 5 0 0 0 6 0"></path></svg>, // simple placeholder icon
      url: `https://reddit.com/submit?url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(shareTitle)}`,
      color: "#FF4500"
    }
  ];

  return (
    <div className="share-buttons-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
      <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Share:</span>
      
      <button 
        onClick={handleCopyLink} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-color)', cursor: 'pointer', transition: 'all 0.2s' }}
        title="Copy Link"
      >
        <Link2 size={16} />
        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{copied ? "Copied!" : "Copy"}</span>
      </button>

      {socialLinks.map((social) => (
        <a 
          key={social.name} 
          href={social.url} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', color: social.color, border: '1px solid var(--border-color)', transition: 'all 0.2s', cursor: 'pointer' }}
          title={`Share on ${social.name}`}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.borderColor = social.color; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
        >
          {social.icon}
        </a>
      ))}

      {/* Web Share API / Arratai / More */}
      <button 
        onClick={handleWebShare} 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', transition: 'all 0.2s', cursor: 'pointer' }}
        title="More options (Arratai, etc.)"
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.color = 'var(--primary-color)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <Share2 size={18} />
      </button>
    </div>
  );
}
