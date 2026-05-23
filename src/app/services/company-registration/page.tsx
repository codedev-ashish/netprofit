import styles from "../page.module.css";
import Link from "next/link";

export default function CompanyRegistrationPage() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Company Registration Services</h1>
        <p className={styles.subtitle}>
          Start your business the right way. We register Private Limited Companies, LLPs, and Startups.
        </p>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.serviceGrid}>
          <div className={styles.serviceCard}>
            <div className={styles.cardHeader}>
              <h3>Private Limited Company</h3>
            </div>
            <p className={styles.description}>The most popular business structure for startups and growing businesses.</p>
            <div className={styles.cardFooter}>
              <Link href="/services" className={styles.buyBtn} style={{textDecoration: 'none', textAlign: 'center', display: 'block', width: '100%'}}>Apply Now</Link>
            </div>
          </div>
          
          <div className={styles.serviceCard}>
            <div className={styles.cardHeader}>
              <h3>Limited Liability Partnership (LLP)</h3>
            </div>
            <p className={styles.description}>Perfect for professional firms and small businesses with lower compliance requirements.</p>
            <div className={styles.cardFooter}>
              <Link href="/services" className={styles.buyBtn} style={{textDecoration: 'none', textAlign: 'center', display: 'block', width: '100%'}}>Apply Now</Link>
            </div>
          </div>
          
          <div className={styles.serviceCard}>
            <div className={styles.cardHeader}>
              <h3>One Person Company (OPC)</h3>
            </div>
            <p className={styles.description}>Start a company with just one director and enjoy limited liability.</p>
            <div className={styles.cardFooter}>
              <Link href="/services" className={styles.buyBtn} style={{textDecoration: 'none', textAlign: 'center', display: 'block', width: '100%'}}>Apply Now</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
