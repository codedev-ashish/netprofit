"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import html2canvas from "html2canvas";
import styles from "./page.module.css";
import { UploadCloud, FileJson, X, Building2, FileText, Users, ScanBarcode, Table, HardDrive, Share2, MessageCircle, Send, Camera } from "lucide-react";
import ToolHeader from "../../../components/ToolHeader";
import DisclaimerCard from "../../../components/DisclaimerCard";

export default function GstErrorTool({ initialTitle }: { initialTitle?: string }) {
  const [dragActive, setDragActive] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errorData, setErrorData] = useState<any[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [gstin, setGstin] = useState<string | null>(null);
  const [period, setPeriod] = useState<string | null>(null);
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({ b2b: 0, cdnr: 0, b2cs: 0, hsn: 0, table14: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);

        let dataArray: any[] = [];
        let counts: Record<string, number> = { b2b: 0, cdnr: 0, b2cs: 0, hsn: 0, table14: 0 };

        if (json.gstin) setGstin(json.gstin);
        if (json.fp) setPeriod(json.fp);

        // 1. Advanced GST JSON Flattener
        if (json.error_report && typeof json.error_report === 'object') {
          for (const sectionKey of Object.keys(json.error_report)) {
            const section = json.error_report[sectionKey];
            if (Array.isArray(section)) {
              let secCount = 0;
              section.forEach((errorGroup: any) => {
                if (!errorGroup.error_msg || errorGroup.error_msg.trim() === '') {
                  return;
                }

                secCount++;
                const baseError = {
                  "Error Message": errorGroup.error_msg || ''
                };

                let foundNested = false;
                for (const key of Object.keys(errorGroup)) {
                  if (Array.isArray(errorGroup[key])) {
                    foundNested = true;
                    errorGroup[key].forEach((item: any) => {
                      dataArray.push({
                        ...item,
                        ...baseError
                      });
                    });
                  }
                }

                if (!foundNested) {
                  const cleanGroup = { ...errorGroup };
                  delete cleanGroup.error_msg;
                  delete cleanGroup.error_cd;
                  dataArray.push({ ...cleanGroup, ...baseError });
                }
              });

              const key = sectionKey.toLowerCase();
              if (counts[key] !== undefined) {
                counts[key] += secCount;
              } else if (secCount > 0) {
                counts[key] = secCount;
              }
            }
          }
        }

        // 2. Fallback Generic Logic
        if (dataArray.length === 0) {
          if (Array.isArray(json)) {
            dataArray = json;
          } else if (typeof json === 'object') {
            const possibleKeys = ['errorReport', 'errors', 'error_report', 'data', 'details'];
            for (const key of possibleKeys) {
              if (Array.isArray(json[key])) {
                dataArray = json[key];
                break;
              }
            }
            if (dataArray.length === 0) {
              for (const value of Object.values(json)) {
                if (Array.isArray(value)) {
                  dataArray = value;
                  break;
                }
              }
            }
          }
        }

        if (dataArray && dataArray.length > 0) {
          setErrorData(dataArray);
          setSectionCounts(counts);
        } else {
          setErrorMsg("Could not find a valid list of errors in the provided JSON file. Ensure it contains an array of error records.");
          setErrorData(null);
        }

      } catch (err) {
        setErrorMsg("Invalid JSON file. Please ensure you uploaded the correct file from the GST portal.");
        setErrorData(null);
      }
    };
    reader.readAsText(file);
  };

  const onDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const resetData = () => {
    setErrorData(null);
    setFileName(null);
    setErrorMsg(null);
    setGstin(null);
    setPeriod(null);
    setSectionCounts({ b2b: 0, cdnr: 0, b2cs: 0, hsn: 0, table14: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const gstKeyMap: Record<string, string> = {
    hsn_sc: "HSN/SAC",
    qty: "Qty",
    num: "Num",
    txval: "Taxable Value",
    camt: "CGST",
    samt: "SGST",
    iamt: "IGST",
    csamt: "Cess",
    rt: "Rate %",
    "Error Message": "Error Message"
  };

  const preferredSequence = [
    'hsn_sc', 'qty', 'num', 'txval', 'camt', 'samt', 'iamt', 'rt', 'Error Message'
  ];

  let displayHeaders: string[] = [];
  if (errorData && errorData.length > 0) {
    displayHeaders = preferredSequence.filter(col =>
      col === 'Error Message' || errorData.some(row => row[col] !== undefined)
    );

    const rawHeaders = Object.keys(errorData[0]).filter(k => typeof errorData[0][k] !== 'object');
    const extraHeaders = rawHeaders.filter(h => !displayHeaders.includes(h) && gstKeyMap[h]);

    displayHeaders = [...displayHeaders.filter(h => h !== 'Error Message'), ...extraHeaders, 'Error Message'];
  }

  const renderSectionIcon = (key: string, hasError: boolean) => {
    const className = hasError ? styles.sectionIconError : styles.sectionIcon;
    switch (key) {
      case 'b2b': return <Building2 size={28} className={className} />;
      case 'cdnr': return <FileText size={28} className={className} />;
      case 'b2cs': return <Users size={28} className={className} />;
      case 'hsn': return <ScanBarcode size={28} className={className} />;
      case 'table14': return <Table size={28} className={className} />;
      default: return <HardDrive size={28} className={className} />;
    }
  };

  const shareText = "Check out this amazing GST Error Report Utility to easily find and fix your GSTR-1 errors!";
  const shareUrl = typeof window !== 'undefined' ? window.location.href : "";

  const shareOnWhatsApp = () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`, "_blank");
  const shareOnTelegram = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
  const shareOnFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank");

  const takeScreenshot = async () => {
    if (!captureRef.current) return;
    setIsCapturing(true);

    try {
      // Slight delay to allow any UI updates (like watermark) to render
      await new Promise(res => setTimeout(res, 100));
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
        useCORS: true
      });
      const imgData = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = imgData;
      link.download = `GST_Errors_${gstin || 'Report'}.png`;
      link.click();
    } catch (e) {
      console.error("Screenshot failed", e);
      alert("Failed to take screenshot.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <>
      <ToolHeader toolSlug="gst-error-tool" initialTitle={initialTitle || "GST Error Tool"} />
      <div className={styles.container}>
        {!errorData && (
          <div
            className={`${styles.uploadSection} ${dragActive ? styles.dragActive : ''}`}
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={64} className={styles.uploadIcon} />
            <h3 className={styles.uploadText}>Open GSTR 1 Error Report</h3>
            <p className={styles.uploadSubtext}>Upload your generated GSTR-1 error report JSON file.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className={styles.fileInput}
              onChange={onFileChange}
            />
            <button className={styles.browseBtn} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              Show Errors
            </button>
          </div>
        )}

        {errorMsg && (
          <div className={styles.errorMsg}>
            {errorMsg}
          </div>
        )}

        {errorData && (
          <>
            <div ref={captureRef} className={`${styles.captureArea} ${isCapturing ? styles.capturingMode : ''}`}>
              <div className={styles.summaryBar}>
                <HardDrive size={24} style={{ color: '#3b82f6' }} />
                <div>
                  <span className={styles.summaryLabel}>GSTIN:</span>
                  <span className={styles.summaryValue}>{gstin || 'N/A'}</span>
                </div>
                <div>
                  <span className={styles.summaryLabel}>Period:</span>
                  <span className={styles.summaryValue}>{period || 'N/A'}</span>
                </div>
                <div>
                  <span className={styles.summaryLabel} style={{ color: '#ef4444' }}>Total Errors: {errorData.length}</span>
                </div>
              </div>

              <div className={styles.sectionCards}>
                {Object.entries(sectionCounts).map(([key, count]) => (
                  <div key={key} className={styles.sectionCard}>
                    {renderSectionIcon(key, count > 0)}
                    <span className={styles.sectionName}>{key.toUpperCase()}</span>
                    {count > 0 ? (
                      <span className={styles.badgeError}>{count} errors</span>
                    ) : (
                      <span className={styles.badgeOk}>✓ OK</span>
                    )}
                  </div>
                ))}
              </div>

              <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                  <h3 className={styles.tableTitle}>
                    ⚠️ Summary Errors <span style={{ background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.9rem', marginLeft: '8px' }}>{errorData.length}</span>
                  </h3>
                  {!isCapturing && (
                    <div className={styles.tableActions}>
                      <button className={styles.resetBtn} onClick={resetData}>
                        <X size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                        Upload New File
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        {displayHeaders.map((header) => (
                          <th key={header}>{gstKeyMap[header] || header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {errorData.map((row, i) => (
                        <tr key={i}>
                          {displayHeaders.map((header) => (
                            <td key={header + i} style={{ color: header === 'Error Message' ? '#ef4444' : 'inherit' }}>
                              {String(row[header] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Watermark only visible during capture */}
              {isCapturing && (
                <div className={styles.watermark}>
                  Generated via <strong>{typeof window !== 'undefined' ? window.location.hostname : 'Website'}</strong> <br />
                  <span style={{ fontSize: '0.85rem' }}>{typeof window !== 'undefined' ? window.location.href : ''}</span>
                </div>
              )}
            </div>

            {/* Share Buttons */}
            <div className={styles.shareSection}>
              <h4 className={styles.shareTitle}><Share2 size={18} /> Share this utility</h4>
              <div className={styles.shareButtons}>
                <button className={`${styles.shareBtn} ${styles.screenshot}`} onClick={takeScreenshot}>
                  <Camera size={18} /> Save Screenshot
                </button>
                <button className={`${styles.shareBtn} ${styles.whatsapp}`} onClick={shareOnWhatsApp}>
                  <MessageCircle size={18} /> WhatsApp
                </button>
                <button className={`${styles.shareBtn} ${styles.telegram}`} onClick={shareOnTelegram}>
                  <Send size={18} /> Telegram
                </button>
                <button className={`${styles.shareBtn} ${styles.facebook}`} onClick={shareOnFacebook}>
                  Facebook
                </button>
              </div>
            </div>
          </>
        )}

        <DisclaimerCard toolSlug="gst-error-tool" />
      </div>
    </>
  );
}
