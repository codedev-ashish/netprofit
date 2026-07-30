"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

const defaultOrder = ['hero', 'coreServices', 'news', 'popularServices', 'ipos', 'tools', 'whyUs'];
const blockNames: Record<string, string> = {
  hero: "Hero Section",
  coreServices: "Core Services",
  news: "News Slider",
  popularServices: "Popular Services",
  ipos: "IPOs Slider",
  tools: "Tools Slider",
  whyUs: "Why Us Section"
};

export default function HomePageConfig() {
  const [sectionOrder, setSectionOrder] = useState<string[]>(defaultOrder);
  const [heroTitle, setHeroTitle] = useState("One Platform for All Your Tax, Legal & Business Registration Needs");
  const [heroSubtitle, setHeroSubtitle] = useState("File ITR, register your company, manage GST compliance, Accounting and other services with expert CAs at NetProfit. Trusted by 1000+ businesses across India.");
  
  // Sliders
  const [newsEnabled, setNewsEnabled] = useState(true);
  const [newsTitle, setNewsTitle] = useState("Latest News & Updates");
  const [newsCount, setNewsCount] = useState(5);
  
  const [ipoEnabled, setIpoEnabled] = useState(true);
  const [ipoTitle, setIpoTitle] = useState("Latest IPOs");
  const [ipoCount, setIpoCount] = useState(5);
  
  const [toolsEnabled, setToolsEnabled] = useState(true);
  const [toolsTitle, setToolsTitle] = useState("Financial Tools & Calculators");
  const [toolsCount, setToolsCount] = useState(5);

  // Core Services
  const [coreServicesTitle, setCoreServicesTitle] = useState("Our Core Services");
  const [coreServices, setCoreServices] = useState<any[]>([
    { title: "Corporate Services", description: "Complete corporate solutions from company registration to annual compliance. Start your business the right way.", icon: "🏢", link: "/services/private-limited-company" },
    { title: "Legal Services", description: "Our experts oversee contracts, disputes, and legal problems. Stay fully compliant and secure.", icon: "⚖️", link: "/services" },
    { title: "Licensing Services", description: "Get essential business licenses seamlessly, from FSSAI to Trade Licenses and MSME registration.", icon: "📜", link: "/services" },
    { title: "Accounting & Taxation", description: "Manage finances and tax regulations easily. GST filing, ITR, and professional bookkeeping.", icon: "📊", link: "/services/gst-registration" }
  ]);

  // Popular Services
  const [popularServicesTitle, setPopularServicesTitle] = useState("Popular Services by NetProfit");
  const [popularServices, setPopularServices] = useState<any[]>([
    { title: "Company Registration", subtitle: "Pvt Ltd, LLP, Startups", link: "/services/private-limited-company" },
    { title: "GST Registration", subtitle: "Fast & 100% Online", link: "/services/gst-registration" },
    { title: "Income Tax Filing", subtitle: "Max Refunds, Zero Errors", link: "/services/income-tax-return" },
    { title: "LLP Registration", subtitle: "Register an LLP Fast", link: "/services/limited-liability-partnership" },
    { title: "PF & ESIC Return", subtitle: "Easy Monthly Filing", link: "/services/pf-return" },
    { title: "MSME / Udyam", subtitle: "Govt Benefits & Subsidies", link: "/services/msme-registration" }
  ]);

  // Why Us
  const [whyUsTitle, setWhyUsTitle] = useState("Why Smart Founders Choose NetProfit");
  const [whyUsSubtitle, setWhyUsSubtitle] = useState("Big tech portals treat you like a ticket number. We treat you like a partner. Get 100% human-led legal compliance.");
  const [whyUsStats, setWhyUsStats] = useState("1,000+");
  const [whyUsStatsLabel, setWhyUsStatsLabel] = useState("Happy Founders");
  const [whyUsBenefits, setWhyUsBenefits] = useState<any[]>([
    { title: "✔️ Dedicated Expert on WhatsApp", description: "No automated replies. Directly message your CA/Expert anytime for instant updates." },
    { title: "✔️ Zero-Penalty Guarantee", description: "We take full responsibility for your filing. Our human audit ensures 100% accuracy or we pay the fine." },
    { title: "✔️ 100% Transparent Pricing", description: "No \"Hidden Charges\" traps. One fixed fee for the entire process, including Govt. charges." }
  ]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "home_page");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.sectionOrder && data.sectionOrder.length > 0) setSectionOrder(data.sectionOrder);
          
          if (data.hero) {
            if (data.hero.title) setHeroTitle(data.hero.title);
            if (data.hero.subtitle) setHeroSubtitle(data.hero.subtitle);
          }
          if (data.sliders) {
            if (data.sliders.news) {
              setNewsEnabled(data.sliders.news.enabled ?? true);
              setNewsTitle(data.sliders.news.title || "Latest News & Updates");
              setNewsCount(data.sliders.news.count || 5);
            }
            if (data.sliders.ipos) {
              setIpoEnabled(data.sliders.ipos.enabled ?? true);
              setIpoTitle(data.sliders.ipos.title || "Latest IPOs");
              setIpoCount(data.sliders.ipos.count || 5);
            }
            if (data.sliders.tools) {
              setToolsEnabled(data.sliders.tools.enabled ?? true);
              setToolsTitle(data.sliders.tools.title || "Financial Tools & Calculators");
              setToolsCount(data.sliders.tools.count || 5);
            }
          }
          if (data.coreServicesBlock) {
            setCoreServicesTitle(data.coreServicesBlock.title || "Our Core Services");
            if (data.coreServicesBlock.items) setCoreServices(data.coreServicesBlock.items);
          }
          if (data.popularServicesBlock) {
            setPopularServicesTitle(data.popularServicesBlock.title || "Popular Services by NetProfit");
            if (data.popularServicesBlock.items) setPopularServices(data.popularServicesBlock.items);
          }
          if (data.whyUs) {
            setWhyUsTitle(data.whyUs.title || "Why Smart Founders Choose NetProfit");
            setWhyUsSubtitle(data.whyUs.subtitle || "Big tech portals treat you like a ticket number. We treat you like a partner. Get 100% human-led legal compliance.");
            setWhyUsStats(data.whyUs.statsNumber || "1,000+");
            setWhyUsStatsLabel(data.whyUs.statsLabel || "Happy Founders");
            if (data.whyUs.benefits) setWhyUsBenefits(data.whyUs.benefits);
          }
        }
      } catch (err) {
        console.error("Error fetching home page settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const docRef = doc(db, "settings", "home_page");
      await setDoc(docRef, {
        sectionOrder,
        hero: {
          title: heroTitle,
          subtitle: heroSubtitle
        },
        coreServicesBlock: {
          title: coreServicesTitle,
          items: coreServices
        },
        popularServicesBlock: {
          title: popularServicesTitle,
          items: popularServices
        },
        whyUs: {
          title: whyUsTitle,
          subtitle: whyUsSubtitle,
          statsNumber: whyUsStats,
          statsLabel: whyUsStatsLabel,
          benefits: whyUsBenefits
        },
        sliders: {
          news: { enabled: newsEnabled, title: newsTitle, count: Number(newsCount) },
          ipos: { enabled: ipoEnabled, title: ipoTitle, count: Number(ipoCount) },
          tools: { enabled: toolsEnabled, title: toolsTitle, count: Number(toolsCount) }
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setMessage("Home page configuration saved successfully!");
    } catch (err: any) {
      console.error(err);
      setMessage("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sectionOrder];
    if (direction === 'up' && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    }
    setSectionOrder(newOrder);
  };

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <h1 className={styles.pageTitle}>Home Page Configuration</h1>
      <p className={styles.pageSubtitle}>Manage layout order and all content blocks on the home page.</p>
      
      <form className={styles.form} onSubmit={handleSave}>
        
        {/* Section Ordering */}
        <div className={`cleartax-card ${styles.managementCard}`} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Section Layout Order</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Arrange the order of sections as they should appear on the homepage (from top to bottom).</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sectionOrder.map((sectionId, idx) => (
              <div key={sectionId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 600 }}>{idx + 1}. {blockNames[sectionId] || sectionId}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => moveSection(idx, 'up')} disabled={idx === 0} style={{ padding: '4px 8px', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}>↑</button>
                  <button type="button" onClick={() => moveSection(idx, 'down')} disabled={idx === sectionOrder.length - 1} style={{ padding: '4px 8px', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: idx === sectionOrder.length - 1 ? 'not-allowed' : 'pointer' }}>↓</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Section */}
        <div className={`cleartax-card ${styles.managementCard}`} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Hero Section</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div className={styles.inputGroup}>
              <label>Hero Title</label>
              <input type="text" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className={styles.inputField} required />
            </div>
            <div className={styles.inputGroup}>
              <label>Hero Subtitle</label>
              <textarea rows={3} value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} className={styles.inputField} required />
            </div>
          </div>
        </div>

        {/* Sliders Configuration */}
        <div className={`cleartax-card ${styles.managementCard}`} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Sliders Configuration</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={newsEnabled} onChange={(e) => setNewsEnabled(e.target.checked)} id="newsEnabled" style={{ width: 'auto' }} />
              <label htmlFor="newsEnabled" style={{ marginBottom: 0, cursor: 'pointer' }}>Enable News Slider</label>
            </div>
            {newsEnabled && (
              <>
                <div className={styles.inputGroup}>
                  <label>News Section Title</label>
                  <input type="text" value={newsTitle} onChange={(e) => setNewsTitle(e.target.value)} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Max Items to Show</label>
                  <input type="number" min="1" max="20" value={newsCount} onChange={(e) => setNewsCount(Number(e.target.value))} className={styles.inputField} />
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={ipoEnabled} onChange={(e) => setIpoEnabled(e.target.checked)} id="ipoEnabled" style={{ width: 'auto' }} />
              <label htmlFor="ipoEnabled" style={{ marginBottom: 0, cursor: 'pointer' }}>Enable IPOs Slider</label>
            </div>
            {ipoEnabled && (
              <>
                <div className={styles.inputGroup}>
                  <label>IPOs Section Title</label>
                  <input type="text" value={ipoTitle} onChange={(e) => setIpoTitle(e.target.value)} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Max Items to Show</label>
                  <input type="number" min="1" max="20" value={ipoCount} onChange={(e) => setIpoCount(Number(e.target.value))} className={styles.inputField} />
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={toolsEnabled} onChange={(e) => setToolsEnabled(e.target.checked)} id="toolsEnabled" style={{ width: 'auto' }} />
              <label htmlFor="toolsEnabled" style={{ marginBottom: 0, cursor: 'pointer' }}>Enable Tools Slider</label>
            </div>
            {toolsEnabled && (
              <>
                <div className={styles.inputGroup}>
                  <label>Tools Section Title</label>
                  <input type="text" value={toolsTitle} onChange={(e) => setToolsTitle(e.target.value)} className={styles.inputField} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Max Items to Show</label>
                  <input type="number" min="1" max="20" value={toolsCount} onChange={(e) => setToolsCount(Number(e.target.value))} className={styles.inputField} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Core Services */}
        <div className={`cleartax-card ${styles.managementCard}`} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Core Services Configuration</h2>
          <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
            <label>Section Title</label>
            <input type="text" value={coreServicesTitle} onChange={(e) => setCoreServicesTitle(e.target.value)} className={styles.inputField} />
          </div>
          {coreServices.map((cs, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div className={styles.inputGroup}>
                <label>Title</label>
                <input type="text" value={cs.title} onChange={e => { const n = [...coreServices]; n[idx].title = e.target.value; setCoreServices(n); }} className={styles.inputField} />
              </div>
              <div className={styles.inputGroup}>
                <label>Icon (Emoji/Text)</label>
                <input type="text" value={cs.icon} onChange={e => { const n = [...coreServices]; n[idx].icon = e.target.value; setCoreServices(n); }} className={styles.inputField} />
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <textarea rows={2} value={cs.description} onChange={e => { const n = [...coreServices]; n[idx].description = e.target.value; setCoreServices(n); }} className={styles.inputField} />
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Link (e.g. /services)</label>
                <input type="text" value={cs.link} onChange={e => { const n = [...coreServices]; n[idx].link = e.target.value; setCoreServices(n); }} className={styles.inputField} />
              </div>
              <button type="button" onClick={() => setCoreServices(coreServices.filter((_, i) => i !== idx))} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>Remove Service</button>
            </div>
          ))}
          <button type="button" onClick={() => setCoreServices([...coreServices, { title: "", description: "", icon: "✨", link: "" }])} className="btn btn-secondary" style={{ color: '#fff', borderColor: '#60a5fa' }}>Add Core Service</button>
        </div>

        {/* Popular Services */}
        <div className={`cleartax-card ${styles.managementCard}`} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Popular Services Configuration</h2>
          <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
            <label>Section Title</label>
            <input type="text" value={popularServicesTitle} onChange={(e) => setPopularServicesTitle(e.target.value)} className={styles.inputField} />
          </div>
          {popularServices.map((ps, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div className={styles.inputGroup}>
                <label>Title</label>
                <input type="text" value={ps.title} onChange={e => { const n = [...popularServices]; n[idx].title = e.target.value; setPopularServices(n); }} className={styles.inputField} />
              </div>
              <div className={styles.inputGroup}>
                <label>Subtitle (Tags)</label>
                <input type="text" value={ps.subtitle} onChange={e => { const n = [...popularServices]; n[idx].subtitle = e.target.value; setPopularServices(n); }} className={styles.inputField} />
              </div>
              <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Link (e.g. /services)</label>
                <input type="text" value={ps.link} onChange={e => { const n = [...popularServices]; n[idx].link = e.target.value; setPopularServices(n); }} className={styles.inputField} />
              </div>
              <button type="button" onClick={() => setPopularServices(popularServices.filter((_, i) => i !== idx))} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>Remove Service</button>
            </div>
          ))}
          <button type="button" onClick={() => setPopularServices([...popularServices, { title: "", subtitle: "", link: "" }])} className="btn btn-secondary" style={{ color: '#fff', borderColor: '#60a5fa' }}>Add Popular Service</button>
        </div>

        {/* Why Us Section */}
        <div className={`cleartax-card ${styles.managementCard}`} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#60a5fa' }}>Why Us Section</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Title</label>
              <input type="text" value={whyUsTitle} onChange={(e) => setWhyUsTitle(e.target.value)} className={styles.inputField} />
            </div>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Subtitle</label>
              <textarea rows={2} value={whyUsSubtitle} onChange={(e) => setWhyUsSubtitle(e.target.value)} className={styles.inputField} />
            </div>
            <div className={styles.inputGroup}>
              <label>Stats Number (e.g. 1,000+)</label>
              <input type="text" value={whyUsStats} onChange={(e) => setWhyUsStats(e.target.value)} className={styles.inputField} />
            </div>
            <div className={styles.inputGroup}>
              <label>Stats Label (e.g. Happy Founders)</label>
              <input type="text" value={whyUsStatsLabel} onChange={(e) => setWhyUsStatsLabel(e.target.value)} className={styles.inputField} />
            </div>
          </div>
          
          <h3 style={{ fontSize: '1rem', marginTop: '1.5rem', marginBottom: '1rem' }}>Benefits List</h3>
          {whyUsBenefits.map((ben, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div className={styles.inputGroup}>
                <label>Title</label>
                <input type="text" value={ben.title} onChange={e => { const n = [...whyUsBenefits]; n[idx].title = e.target.value; setWhyUsBenefits(n); }} className={styles.inputField} />
              </div>
              <div className={styles.inputGroup}>
                <label>Description</label>
                <textarea rows={2} value={ben.description} onChange={e => { const n = [...whyUsBenefits]; n[idx].description = e.target.value; setWhyUsBenefits(n); }} className={styles.inputField} />
              </div>
              <button type="button" onClick={() => setWhyUsBenefits(whyUsBenefits.filter((_, i) => i !== idx))} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}>Remove Benefit</button>
            </div>
          ))}
          <button type="button" onClick={() => setWhyUsBenefits([...whyUsBenefits, { title: "", description: "" }])} className="btn btn-secondary" style={{ color: '#fff', borderColor: '#60a5fa' }}>Add Benefit</button>
        </div>
        
        {message && (
          <div style={{ color: message.includes("Error") ? "#dc2626" : "#16a34a", padding: "10px 0", fontWeight: 'bold', textAlign: 'center', fontSize: '1.1rem' }}>
            {message}
          </div>
        )}

        <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg-color)', padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', zIndex: 10, margin: '2rem 0 0 0' }}>
          <button type="submit" className={styles.submitBtn} disabled={loading} style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
            {loading ? "Saving..." : "Save All Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
