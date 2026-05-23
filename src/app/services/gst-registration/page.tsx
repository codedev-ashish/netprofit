import styles from "../page.module.css";
import Link from "next/link";

export default function GstRegistrationPage() {
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>GST Registration & Return Filing</h1>
        <p className={styles.subtitle}>
          100% Online process. Get your business GST registered quickly and correctly with expert CA support.
        </p>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.serviceGrid}>
          <div className={styles.serviceCard}>
            <div className={styles.cardHeader}>
              <h3>GST Registration</h3>
            </div>
            <p className={styles.description}>Get your GSTIN in 3-5 days with complete documentation support.</p>
            <div className={styles.cardFooter}>
              <Link href="/services" className={styles.buyBtn} style={{textDecoration: 'none', textAlign: 'center', display: 'block', width: '100%'}}>Apply Now</Link>
            </div>
          </div>
          
          <div className={styles.serviceCard}>
            <div className={styles.cardHeader}>
              <h3>GST Return Filing</h3>
            </div>
            <p className={styles.description}>Timely filing of GSTR-1, GSTR-3B, and Annual Returns to avoid penalties.</p>
            <div className={styles.cardFooter}>
              <Link href="/services" className={styles.buyBtn} style={{textDecoration: 'none', textAlign: 'center', display: 'block', width: '100%'}}>Apply Now</Link>
            </div>
          </div>
          
          <div className={styles.serviceCard}>
            <div className={styles.cardHeader}>
              <h3>GST Advisory</h3>
            </div>
            <p className={styles.description}>Expert consultation on GST applicability, rates, and input tax credit optimization.</p>
            <div className={styles.cardFooter}>
              <Link href="/services" className={styles.buyBtn} style={{textDecoration: 'none', textAlign: 'center', display: 'block', width: '100%'}}>Apply Now</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
