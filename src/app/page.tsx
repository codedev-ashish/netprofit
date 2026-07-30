import styles from "./page.module.css";
import Link from "next/link";
import { Metadata } from "next";
import { db } from "../lib/firebase";
import { doc, getDoc, collection, query, limit, getDocs, orderBy } from "firebase/firestore";
import HorizontalSlider, { SliderItem } from "../components/HorizontalSlider";

export const revalidate = 60;

function decodeTitle(t: any) {
  return t ? String(t).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/gi, ' ') : t;
}

export async function generateMetadata(): Promise<Metadata> {
  let title = undefined;
  let description = undefined;
  let keywords = undefined;

  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data()?.home;
      if (data) {
        if (data.title) title = data.title;
        if (data.description) description = data.description;
        if (data.keywords) keywords = data.keywords;
      }
    }
  } catch (e) {}

  return {
    ...(title && { title: { absolute: decodeTitle(title) } }),
    ...(description && { description }),
    ...(keywords && { keywords }),
    alternates: {
      canonical: "https://netprofit.in/",
    },
    openGraph: {
      ...(title && { title }),
      ...(description && { description }),
      type: "website",
      url: "https://netprofit.in/",
    },
    twitter: {
      ...(title && { title }),
      ...(description && { description }),
    }
  };
}

export default async function Home() {
  const decodeTitle = (t: any) => t ? String(t).replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&#039;/gi, "'").replace(/&#x27;/gi, "'").replace(/&nbsp;/gi, ' ') : t;

  // Default Settings & Content
  let sectionOrder = ['hero', 'coreServices', 'news', 'popularServices', 'ipos', 'tools', 'whyUs'];
  
  let heroTitle = "One Platform for All Your Tax, Legal & Business Registration Needs";
  let heroSubtitle = "File ITR, register your company, manage GST compliance, Accounting and other services with expert CAs at NetProfit. Trusted by 1000+ businesses across India.";
  
  let newsEnabled = true; let newsTitle = "Latest News"; let newsCount = 5;
  let ipoEnabled = true; let ipoTitle = "Latest IPOs"; let ipoCount = 5;
  let toolsEnabled = true; let toolsTitle = "Calculators & Tools"; let toolsCount = 5;

  let coreServicesTitle = "Our Core Services";
  let coreServices = [
    { title: "Corporate Services", description: "Complete corporate solutions from company registration to annual compliance. Start your business the right way.", icon: "🏢", link: "/services/private-limited-company" },
    { title: "Legal Services", description: "Our experts oversee contracts, disputes, and legal problems. Stay fully compliant and secure.", icon: "⚖️", link: "/services" },
    { title: "Licensing Services", description: "Get essential business licenses seamlessly, from FSSAI to Trade Licenses and MSME registration.", icon: "📜", link: "/services" },
    { title: "Accounting & Taxation", description: "Manage finances and tax regulations easily. GST filing, ITR, and professional bookkeeping.", icon: "📊", link: "/services/gst-registration" }
  ];

  let popularServicesTitle = "Popular Services by NetProfit";
  let popularServices = [
    { title: "Company Registration", subtitle: "Pvt Ltd, LLP, Startups", link: "/services/private-limited-company" },
    { title: "GST Registration", subtitle: "Fast & 100% Online", link: "/services/gst-registration" },
    { title: "Income Tax Filing", subtitle: "Max Refunds, Zero Errors", link: "/services/income-tax-return" },
    { title: "LLP Registration", subtitle: "Register an LLP Fast", link: "/services/limited-liability-partnership" },
    { title: "PF & ESIC Return", subtitle: "Easy Monthly Filing", link: "/services/pf-return" },
    { title: "MSME / Udyam", subtitle: "Govt Benefits & Subsidies", link: "/services/msme-registration" }
  ];

  let whyUsTitle = "Why Smart Founders Choose NetProfit";
  let whyUsSubtitle = "Big tech portals treat you like a ticket number. We treat you like a partner. Get 100% human-led legal compliance.";
  let whyUsStats = "1,000+";
  let whyUsStatsLabel = "Happy Founders";
  let whyUsBenefits = [
    { title: "✔️ Dedicated Expert on WhatsApp", description: "No automated replies. Directly message your CA/Expert anytime for instant updates." },
    { title: "✔️ Zero-Penalty Guarantee", description: "We take full responsibility for your filing. Our human audit ensures 100% accuracy or we pay the fine." },
    { title: "✔️ 100% Transparent Pricing", description: "No \"Hidden Charges\" traps. One fixed fee for the entire process, including Govt. charges." }
  ];

  // Fetch from Firestore
  let customSchema = undefined;
  try {
    const docRef = doc(db, "settings", "public_seo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const seoData = docSnap.data()?.home;
      if (seoData?.customSchema) customSchema = seoData.customSchema;
    }
  } catch (e) {}

  try {
    const docRef = doc(db, "settings", "home_page");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.sectionOrder && data.sectionOrder.length > 0) sectionOrder = data.sectionOrder;
      
      if (data.hero?.title) heroTitle = data.hero.title;
      if (data.hero?.subtitle) heroSubtitle = data.hero.subtitle;
      
      if (data.sliders?.news) {
        newsEnabled = data.sliders.news.enabled ?? true;
        newsTitle = data.sliders.news.title || "Latest News";
        newsCount = data.sliders.news.count || 5;
      }
      if (data.sliders?.ipos) {
        ipoEnabled = data.sliders.ipos.enabled ?? true;
        ipoTitle = data.sliders.ipos.title || "Latest IPOs";
        ipoCount = data.sliders.ipos.count || 5;
      }
      if (data.sliders?.tools) {
        toolsEnabled = data.sliders.tools.enabled ?? true;
        toolsTitle = data.sliders.tools.title || "Calculators & Tools";
        toolsCount = data.sliders.tools.count || 5;
      }

      if (data.coreServicesBlock) {
        if (data.coreServicesBlock.title) coreServicesTitle = data.coreServicesBlock.title;
        if (data.coreServicesBlock.items) coreServices = data.coreServicesBlock.items;
      }

      if (data.popularServicesBlock) {
        if (data.popularServicesBlock.title) popularServicesTitle = data.popularServicesBlock.title;
        if (data.popularServicesBlock.items) popularServices = data.popularServicesBlock.items;
      }

      if (data.whyUs) {
        if (data.whyUs.title) whyUsTitle = data.whyUs.title;
        if (data.whyUs.subtitle) whyUsSubtitle = data.whyUs.subtitle;
        if (data.whyUs.statsNumber) whyUsStats = data.whyUs.statsNumber;
        if (data.whyUs.statsLabel) whyUsStatsLabel = data.whyUs.statsLabel;
        if (data.whyUs.benefits) whyUsBenefits = data.whyUs.benefits;
      }
    }
  } catch (e) {
    console.error("Error fetching home page settings", e);
  }

  // Fetch dynamic collections
  let newsItems: SliderItem[] = [];
  if (newsEnabled && sectionOrder.includes('news')) {
    try {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(newsCount));
      const querySnapshot = await getDocs(q);
      newsItems = querySnapshot.docs.map(doc => {
        const d = doc.data();
        let dateStr = undefined;
        if (d.date) {
          if (typeof d.date === 'string') dateStr = new Date(d.date).toLocaleDateString();
          else if (d.date.toDate) dateStr = d.date.toDate().toLocaleDateString();
          else if (d.date.seconds) dateStr = new Date(d.date.seconds * 1000).toLocaleDateString();
        }
        return {
          id: doc.id,
          title: decodeTitle(d.title),
          image: d.imageUrl || d.coverImage,
          link: `/news/${d.slug || doc.id}`,
          tag: d.category || "News",
          date: dateStr
        };
      });
    } catch(e) { console.error("Error fetching news for slider", e); }
  }

  let ipoItems: SliderItem[] = [];
  if (ipoEnabled && sectionOrder.includes('ipos')) {
    try {
      const q = query(collection(db, "ipos"), orderBy("createdAt", "desc"), limit(ipoCount));
      const querySnapshot = await getDocs(q);
      ipoItems = querySnapshot.docs.map(doc => {
        const d = doc.data();
        const openDateStr = d.timelineFields?.find((f: any) => f.id === 'openDate')?.value || d.timeline?.openDate || d.openDate || 'TBA';
        const closeDateStr = d.timelineFields?.find((f: any) => f.id === 'closeDate')?.value || d.timeline?.closeDate || d.closeDate || 'TBA';
        
        // Format dates nicely if they are valid date strings
        const formatDate = (dateStr: string) => {
          if (dateStr === 'TBA') return dateStr;
          try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
            }
          } catch(e) {}
          return dateStr;
        };

        const open = formatDate(openDateStr);
        const close = formatDate(closeDateStr);
        return {
          id: doc.id,
          title: decodeTitle(d.name || d.title),
          description: `Open: ${open} | Close: ${close}`,
          image: d.logoUrl || d.imageUrl,
          link: `/ipo/${d.slug || doc.id}`,
          status: d.status || "Upcoming",
        };
      });
    } catch(e) { console.error("Error fetching IPOs for slider", e); }
  }

  let toolItems: SliderItem[] = [];
  if (toolsEnabled && sectionOrder.includes('tools')) {
    try {
      const q = query(collection(db, "tools"), orderBy("name", "asc"), limit(toolsCount));
      const querySnapshot = await getDocs(q);
      toolItems = querySnapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          title: decodeTitle(d.name || d.title),
          description: d.description,
          link: `/tools/${d.slug || doc.id}`,
          tag: "Tool"
        };
      });
    } catch(e) { console.error("Error fetching tools for slider", e); }
  }

  // Define section renderers
  const renderSection = (sectionId: string, index: number) => {
    switch (sectionId) {
      case 'hero':
        return (
          <section key={`sec-${index}`} className={styles.hero}>
            <div className={styles.heroContent}>
              <h1 className={styles.title}>{heroTitle}</h1>
              <p className={styles.subtitle}>{heroSubtitle}</p>
              <div className={styles.ctaGroup}>
                <Link href="/auth?mode=register" className={`btn btn-primary ${styles.heroBtn}`}>Registration</Link>
                <Link href="/auth?mode=login" className={`btn btn-secondary ${styles.heroBtn}`}>Login</Link>
              </div>
              <div className={styles.trustBadges}>
                <span>🔒 100% Secure Platform</span>
                <span>• Verified Experts</span>
                <span>• Pan-India Service</span>
              </div>
            </div>
          </section>
        );

      case 'coreServices':
        if (!coreServices || coreServices.length === 0) return null;
        return (
          <section key={`sec-${index}`} className={styles.section}>
            <h2 className={styles.sectionTitle}>{coreServicesTitle}</h2>
            <div className={styles.features}>
              {coreServices.map((service, idx) => (
                <div key={idx} className={`premium-card ${styles.featureCard}`}>
                  <div className={styles.featureIcon}>{service.icon || "✨"}</div>
                  <h2>{service.title}</h2>
                  <p>{service.description}</p>
                  {service.link && (
                    <Link href={service.link} className={styles.learnMore}>Read More →</Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'popularServices':
        if (!popularServices || popularServices.length === 0) return null;
        return (
          <section key={`sec-${index}`} className={`${styles.section} ${styles.altSection}`}>
            <h2 className={styles.sectionTitle}>{popularServicesTitle}</h2>
            <div className={styles.servicesGrid}>
              {popularServices.map((service, idx) => (
                <Link key={idx} href={service.link || "#"} className={`premium-card ${styles.serviceItem}`}>
                  <h3>{service.title}</h3>
                  <p>{service.subtitle}</p>
                </Link>
              ))}
            </div>
          </section>
        );

      case 'whyUs':
        return (
          <section key={`sec-${index}`} className={styles.section}>
            <div className={styles.whyUs}>
              <div className={styles.whyUsText}>
                <h2 className={styles.sectionTitle} style={{ textAlign: 'left' }}>{whyUsTitle}</h2>
                <p className={styles.whyUsSubtitle}>{whyUsSubtitle}</p>
                <ul className={styles.benefitsList}>
                  {whyUsBenefits?.map((ben, idx) => (
                    <li key={idx}>
                      <strong>{ben.title}</strong>
                      <p>{ben.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={styles.whyUsImage}>
                <div className={styles.imagePlaceholder}>
                  <div className={styles.stats}>
                    <h3>{whyUsStats}</h3>
                    <p>{whyUsStatsLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'news':
        return newsEnabled && newsItems.length > 0 ? (
          <HorizontalSlider key={`sec-${index}`} title={newsTitle} items={newsItems} viewAllLink="/news" />
        ) : null;

      case 'ipos':
        return ipoEnabled && ipoItems.length > 0 ? (
          <HorizontalSlider key={`sec-${index}`} title={ipoTitle} items={ipoItems} viewAllLink="/ipo" />
        ) : null;

      case 'tools':
        return toolsEnabled && toolItems.length > 0 ? (
          <HorizontalSlider key={`sec-${index}`} title={toolsTitle} items={toolItems} viewAllLink="/tools" />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "NetProfit",
            "url": "https://netprofit.in/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://netprofit.in/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
      {customSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: customSchema }} />
      )}
      {sectionOrder.map((sectionId, index) => renderSection(sectionId, index))}
    </div>
  );
}
