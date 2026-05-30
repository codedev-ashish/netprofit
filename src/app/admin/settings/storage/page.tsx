"use client";

import { useState, useEffect } from "react";
import styles from "../../page.module.css";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

type StorageProvider = "firebase" | "gdrive" | "idrive";

export default function StorageConfigPage() {
  const [storageProvider, setStorageProvider] = useState<StorageProvider>("firebase");

  // Google Drive fields
  const [gdriveMode, setGdriveMode] = useState("service_account");
  const [clientEmail, setClientEmail] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [linkedEmail, setLinkedEmail] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [parentFolderId, setParentFolderId] = useState("");

  // iDrive e2 fields
  const [idriveAccessKey, setIdriveAccessKey] = useState("sUk4RWGMjyJZBqH3JO6Z");
  const [idriveSecretKey, setIdriveSecretKey] = useState("vRAprkCKgSZtMSFokbsg3ZwGfFKZCM7p3MpYEXaF");
  const [idriveEndpoint, setIdriveEndpoint] = useState("s3.us-west-2.idrivee2.com");
  const [idriveRegion, setIdriveRegion] = useState("us-west-2");
  const [idriveBucket, setIdriveBucket] = useState("netprofit-uploads");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [redirectUri, setRedirectUri] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRedirectUri(`${window.location.protocol}//${window.location.host}/api/auth/gdrive/callback`);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_success") === "true") {
      setMessageType("success");
      setMessage("Google Account linked successfully!");
    } else if (params.get("oauth_error")) {
      setMessageType("error");
      setMessage("OAuth Failed: " + params.get("oauth_error"));
    }

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "storage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Load provider — support legacy gdriveEnabled flag
          if (data.storageProvider) {
            setStorageProvider(data.storageProvider as StorageProvider);
          } else if (data.gdriveEnabled) {
            setStorageProvider("gdrive");
          } else {
            setStorageProvider("firebase");
          }
          // Google Drive
          setGdriveMode(data.gdriveMode || "service_account");
          setClientEmail(data.clientEmail || "");
          setPrivateKey(data.privateKey || "");
          setClientId(data.clientId || "");
          setClientSecret(data.clientSecret || "");
          setLinkedEmail(data.linkedEmail || "");
          setRefreshToken(data.refreshToken || "");
          setParentFolderId(data.parentFolderId || "");
          // iDrive
          if (data.idriveAccessKey) setIdriveAccessKey(data.idriveAccessKey);
          if (data.idriveSecretKey) setIdriveSecretKey(data.idriveSecretKey);
          if (data.idriveEndpoint) setIdriveEndpoint(data.idriveEndpoint);
          if (data.idriveRegion) setIdriveRegion(data.idriveRegion);
          if (data.idriveBucket) setIdriveBucket(data.idriveBucket);
        }
      } catch (err) {
        console.error("Error fetching storage settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const docRef = doc(db, "settings", "storage");
      const payload: Record<string, any> = {
        storageProvider,
        gdriveEnabled: storageProvider === "gdrive",
        updatedAt: new Date().toISOString(),
      };

      if (storageProvider === "gdrive") {
        Object.assign(payload, {
          gdriveMode,
          clientEmail,
          privateKey,
          clientId,
          clientSecret,
          parentFolderId,
        });
      } else if (storageProvider === "idrive") {
        Object.assign(payload, {
          idriveAccessKey,
          idriveSecretKey,
          idriveEndpoint,
          idriveRegion,
          idriveBucket,
        });
      }

      await setDoc(docRef, payload, { merge: true });
      setMessageType("success");
      setMessage("Storage configuration saved successfully!");
    } catch (err: any) {
      setMessageType("error");
      setMessage("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = () => {
    if (!clientId || !clientSecret) {
      alert("Please enter both Client ID and Client Secret, then save changes before linking.");
      return;
    }
    window.location.href = "/api/auth/gdrive";
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Google Account?")) return;
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "storage");
      await setDoc(docRef, { linkedEmail: "", refreshToken: "" }, { merge: true });
      setLinkedEmail("");
      setRefreshToken("");
      setMessageType("success");
      setMessage("Google Account disconnected successfully.");
    } catch (err: any) {
      setMessageType("error");
      setMessage("Disconnect failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const providerLabels: Record<StorageProvider, string> = {
    firebase: "Firebase Storage",
    gdrive: "Google Drive",
    idrive: "iDrive e2 (S3-Compatible)",
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Storage Configuration</h1>
      <p className={styles.pageSubtitle}>
        Choose a storage provider for document uploads. Credentials are stored securely in Firestore.
      </p>

      <div className={`cleartax-card ${styles.managementCard}`}>
        <form className={styles.form} onSubmit={handleSave}>

          {/* Provider Selector */}
          <div className={styles.inputGroup} style={{ marginBottom: "2rem" }}>
            <label style={{ fontWeight: "bold", fontSize: "1rem", display: "block", marginBottom: "0.75rem" }}>
              Storage Provider
            </label>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {(["firebase", "gdrive", "idrive"] as StorageProvider[]).map((p) => (
                <label
                  key={p}
                  style={{
                    flex: 1,
                    minWidth: "180px",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem 1.25rem",
                    border: `2px solid ${storageProvider === p ? "var(--primary-color)" : "var(--border-color)"}`,
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: storageProvider === p ? "rgba(99,102,241,0.08)" : "var(--card-bg)",
                    transition: "all 0.2s",
                    fontWeight: storageProvider === p ? 600 : 400,
                  }}
                >
                  <input
                    type="radio"
                    name="storageProvider"
                    value={p}
                    checked={storageProvider === p}
                    onChange={() => setStorageProvider(p)}
                    style={{ accentColor: "var(--primary-color)" }}
                  />
                  <span>
                    {p === "firebase" && "🔥 "}
                    {p === "gdrive" && "📁 "}
                    {p === "idrive" && "☁️ "}
                    {providerLabels[p]}
                  </span>
                </label>
              ))}
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              {storageProvider === "firebase" && "Files will be stored in Firebase Storage under your project."}
              {storageProvider === "gdrive" && "Files will be stored in an organised folder structure in Google Drive."}
              {storageProvider === "idrive" && "Files will be uploaded to your iDrive e2 S3-compatible bucket."}
            </p>
          </div>

          {/* ─── Google Drive Section ─────────────────────── */}
          {storageProvider === "gdrive" && (
            <>
              <h2 style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "#60a5fa" }}>
                Google Drive Settings
              </h2>

              <div className={styles.inputGroup} style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontWeight: "bold" }}>Authentication Method</label>
                <select
                  value={gdriveMode}
                  onChange={(e) => setGdriveMode(e.target.value)}
                  className={styles.inputField}
                  style={{ marginTop: "0.5rem" }}
                >
                  <option value="service_account">Service Account (JSON Key File)</option>
                  <option value="oauth">OAuth 2.0 Web Client (Personal Google Drive / Gmail)</option>
                </select>
              </div>

              {gdriveMode === "service_account" ? (
                <div style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}>
                  <div className={styles.inputGroup}>
                    <label>Service Account Client Email</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className={styles.inputField}
                      placeholder="something@project-id.iam.gserviceaccount.com"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Service Account Private Key (PEM format)</label>
                    <textarea
                      rows={5}
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      className={styles.inputField}
                      placeholder={"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----"}
                      style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}>
                  <div className={styles.inputGroup}>
                    <label>Google OAuth Client ID</label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className={styles.inputField}
                      placeholder="1234567890-abc123xyz.apps.googleusercontent.com"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Google OAuth Client Secret</label>
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      className={styles.inputField}
                      placeholder="GOCSPX-abc123xyz"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Authorized Redirect URI (Add this in Google Cloud Console)</label>
                    <input
                      type="text"
                      value={redirectUri}
                      readOnly
                      className={styles.inputField}
                      style={{ background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }}
                    />
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ display: "block", fontSize: "0.95rem" }}>Link Status:</strong>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {refreshToken ? `Linked as: ${linkedEmail}` : "Not Linked"}
                      </span>
                    </div>
                    {refreshToken ? (
                      <button type="button" onClick={handleDisconnect} className={styles.submitBtn} style={{ background: "#dc2626", padding: "0.5rem 1.5rem", fontSize: "0.9rem" }}>
                        Disconnect
                      </button>
                    ) : (
                      <button type="button" onClick={handleLinkAccount} className={styles.submitBtn} style={{ background: "#2563eb", padding: "0.5rem 1.5rem", fontSize: "0.9rem" }}>
                        Link Google Account
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.inputGroup} style={{ marginBottom: "2rem" }}>
                <label>Google Drive Root Parent Folder ID</label>
                <input
                  type="text"
                  value={parentFolderId}
                  onChange={(e) => setParentFolderId(e.target.value)}
                  className={styles.inputField}
                  placeholder="1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                />
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                  Ensure your Google account or Service Account has Editor/Contributor access to this folder.
                </span>
              </div>
            </>
          )}

          {/* ─── iDrive e2 Section ─────────────────────────── */}
          {storageProvider === "idrive" && (
            <>
              <h2 style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "#60a5fa" }}>
                iDrive e2 (S3-Compatible) Settings
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
                <div className={styles.inputGroup}>
                  <label>Access Key ID</label>
                  <input
                    type="text"
                    value={idriveAccessKey}
                    onChange={(e) => setIdriveAccessKey(e.target.value)}
                    className={styles.inputField}
                    placeholder="Your iDrive e2 Access Key ID"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Secret Access Key</label>
                  <input
                    type="password"
                    value={idriveSecretKey}
                    onChange={(e) => setIdriveSecretKey(e.target.value)}
                    className={styles.inputField}
                    placeholder="Your iDrive e2 Secret Access Key"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Endpoint</label>
                  <input
                    type="text"
                    value={idriveEndpoint}
                    onChange={(e) => setIdriveEndpoint(e.target.value)}
                    className={styles.inputField}
                    placeholder="s3.us-west-2.idrivee2.com"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Region Code</label>
                  <input
                    type="text"
                    value={idriveRegion}
                    onChange={(e) => setIdriveRegion(e.target.value)}
                    className={styles.inputField}
                    placeholder="us-west-2"
                    required
                  />
                </div>

                <div className={styles.inputGroup} style={{ gridColumn: "1 / -1" }}>
                  <label>Bucket Name</label>
                  <input
                    type="text"
                    value={idriveBucket}
                    onChange={(e) => setIdriveBucket(e.target.value)}
                    className={styles.inputField}
                    placeholder="netprofit-uploads"
                    required
                  />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginTop: "0.25rem" }}>
                    The bucket must already exist in your iDrive e2 account and have public read access enabled.
                  </span>
                </div>
              </div>

              <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
                <strong style={{ fontSize: "0.9rem", display: "block", marginBottom: "0.25rem" }}>📌 Note</strong>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                  Files will be uploaded to your bucket with paths following the pattern:
                  <br />
                  <code style={{ fontSize: "0.8rem" }}>admin-documents/&#123;user&#125;/&#123;business&#125;/&#123;service&#125;/&#123;tax-year&#125;/filename</code>
                  <br />
                  <code style={{ fontSize: "0.8rem" }}>user-upload/&#123;business&#125;/&#123;service&#125;/&#123;tax-year&#125;/&#123;period&#125;/filename</code>
                </p>
              </div>
            </>
          )}

          {message && (
            <div style={{ color: messageType === "error" ? "#dc2626" : "#16a34a", padding: "10px 0", fontWeight: "bold" }}>
              {message}
            </div>
          )}

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className={styles.submitBtn} disabled={loading} style={{ padding: "0.8rem 2rem" }}>
              {loading ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
