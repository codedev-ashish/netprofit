"use client";

import styles from "../page.module.css";

export default function AdminMobileApp() {
  return (
    <div>
      <h1 className={styles.pageTitle}>Mobile App Management</h1>
      <p className={styles.pageSubtitle}>Control app versions, maintenance mode, and app settings.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>App Version Control</h2>
        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Minimum Required Version (Android)</label>
            <input type="text" defaultValue="1.0.5" className={styles.inputField} />
          </div>
          <div className={styles.inputGroup}>
            <label>Minimum Required Version (iOS)</label>
            <input type="text" defaultValue="1.0.5" className={styles.inputField} />
          </div>
          <div className={styles.inputGroup} style={{flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
            <input type="checkbox" id="forceUpdate" style={{width: '18px', height: '18px'}} />
            <label htmlFor="forceUpdate">Enable Force Update Prompt</label>
          </div>
          <div className={styles.inputGroup} style={{flexDirection: 'row', alignItems: 'center', gap: '10px'}}>
            <input type="checkbox" id="maintenance" style={{width: '18px', height: '18px'}} />
            <label htmlFor="maintenance">Enable Maintenance Mode (Blocks app access)</label>
          </div>
          <button type="button" className={styles.submitBtn}>Save Configuration</button>
        </form>
      </div>
    </div>
  );
}
