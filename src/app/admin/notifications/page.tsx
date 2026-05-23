"use client";

import styles from "../page.module.css";

export default function AdminNotifications() {
  return (
    <div>
      <h1 className={styles.pageTitle}>Push Notifications</h1>
      <p className={styles.pageSubtitle}>Send announcements and alerts to all users or specific groups.</p>
      
      <div className={`cleartax-card ${styles.managementCard}`}>
        <h2>Send New Notification</h2>
        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Notification Title</label>
            <input type="text" placeholder="e.g. New GST Updates Available!" className={styles.inputField} />
          </div>
          <div className={styles.inputGroup}>
            <label>Message Body</label>
            <textarea rows={3} placeholder="Type your message here..." className={styles.inputField} />
          </div>
          <div className={styles.inputGroup}>
            <label>Target Audience</label>
            <select className={styles.inputField}>
              <option>All Users</option>
              <option>Paid Subscribers Only</option>
              <option>Free Users Only</option>
            </select>
          </div>
          <button type="button" className={styles.submitBtn}>Send Push Notification</button>
        </form>
      </div>
    </div>
  );
}
