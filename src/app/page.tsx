import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>One Platform for All Your Tax, Legal & Business Registration Needs</h1>
          <p className={styles.subtitle}>
            File ITR, register your company and manage GST compliance with expert CAs at NetProfit. Trusted by 12,000+ founders across India.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/services/company-registration" className={`btn btn-secondary ${styles.heroBtn}`}>
              Register Company
            </Link>
          </div>
          <div className={styles.trustBadges}>
            <span>🔒 100% Secure Platform</span>
            <span>• Verified Experts</span>
            <span>• Pan-India Service</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Our Core Services</h2>
        <div className={styles.features}>
          <div className={`premium-card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>🏢</div>
            <h2>Corporate Services</h2>
            <p>Complete corporate solutions from company registration to annual compliance. Start your business the right way.</p>
            <Link href="/services/company-registration" className={styles.learnMore}>Read More →</Link>
          </div>
          <div className={`premium-card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>⚖️</div>
            <h2>Legal Services</h2>
            <p>Our experts oversee contracts, disputes, and legal problems. Stay fully compliant and secure.</p>
            <Link href="/services" className={styles.learnMore}>Read More →</Link>
          </div>
          <div className={`premium-card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>📜</div>
            <h2>Licensing Services</h2>
            <p>Get essential business licenses seamlessly, from FSSAI to Trade Licenses and MSME registration.</p>
            <Link href="/services" className={styles.learnMore}>Read More →</Link>
          </div>
          <div className={`premium-card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>📊</div>
            <h2>Accounting & Taxation</h2>
            <p>Manage finances and tax regulations easily. GST filing, ITR, and professional bookkeeping.</p>
            <Link href="/services/gst-registration" className={styles.learnMore}>Read More →</Link>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.altSection}`}>
        <h2 className={styles.sectionTitle}>Popular Services by NetProfit</h2>
        <div className={styles.servicesGrid}>
          <Link href="/services/company-registration" className={`premium-card ${styles.serviceItem}`}>
            <h3>Company Registration</h3>
            <p>Pvt Ltd, LLP, Startups</p>
          </Link>
          <Link href="/services/gst-registration" className={`premium-card ${styles.serviceItem}`}>
            <h3>GST Registration</h3>
            <p>Fast & 100% Online</p>
          </Link>
          <Link href="/services/trademark" className={`premium-card ${styles.serviceItem}`}>
            <h3>Trademark</h3>
            <p>Protect Your Brand</p>
          </Link>
          <Link href="/services/fssai-license" className={`premium-card ${styles.serviceItem}`}>
            <h3>FSSAI License</h3>
            <p>Food Business Registration</p>
          </Link>
          <Link href="/services/income-tax" className={`premium-card ${styles.serviceItem}`}>
            <h3>Income Tax Filing</h3>
            <p>Max Refunds, Zero Errors</p>
          </Link>
          <Link href="/services/msme-registration" className={`premium-card ${styles.serviceItem}`}>
            <h3>MSME / Udyam</h3>
            <p>Govt Benefits & Subsidies</p>
          </Link>
        </div>
      </section>
      
      <section className={styles.section}>
        <div className={styles.whyUs}>
          <div className={styles.whyUsText}>
            <h2 className={styles.sectionTitle} style={{ textAlign: 'left' }}>Why Smart Founders Choose NetProfit</h2>
            <p className={styles.whyUsSubtitle}>Big tech portals treat you like a ticket number. We treat you like a partner. Get 100% human-led legal compliance.</p>
            
            <ul className={styles.benefitsList}>
              <li>
                <strong>✔️ Dedicated Expert on WhatsApp</strong>
                <p>No automated replies. Directly message your CA/Expert anytime for instant updates.</p>
              </li>
              <li>
                <strong>✔️ Zero-Penalty Guarantee</strong>
                <p>We take full responsibility for your filing. Our human audit ensures 100% accuracy or we pay the fine.</p>
              </li>
              <li>
                <strong>✔️ 100% Transparent Pricing</strong>
                <p>No "starting from" traps. One fixed fee for the entire process, including Govt. charges.</p>
              </li>
            </ul>
          </div>
          <div className={styles.whyUsImage}>
            <div className={styles.imagePlaceholder}>
               <div className={styles.stats}>
                 <h3>12,000+</h3>
                 <p>Happy Founders</p>
               </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
