import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const generateInvoice = async (order: any) => {
  const docRef = doc(db, "settings", "payment");
  const docSnap = await getDoc(docRef);
  const settings = docSnap.exists() ? docSnap.data() : {};

  const docPdf = new jsPDF();

  // Header
  docPdf.setFontSize(22);
  docPdf.setTextColor(30, 58, 138); // Primary color
  docPdf.text("TAX INVOICE", 105, 20, { align: "center" });

  // Company Details
  docPdf.setFontSize(10);
  docPdf.setTextColor(50, 50, 50);
  docPdf.text(settings.companyName || "NetProfit Pvt. Ltd.", 14, 40);
  docPdf.text(settings.billingContact ? `Contact: ${settings.billingContact}` : "123 Tech Park, Sector 4", 14, 45);
  docPdf.text(settings.billingEmail ? `Email: ${settings.billingEmail}` : "Email: support@netprofit.in", 14, 50);

  // Invoice Details
  const finalPdfInvoiceNum = order.invoiceNumber || `INV-${(order.id || '').slice(0, 8).toUpperCase()}`;
  docPdf.text(`Invoice No: ${finalPdfInvoiceNum}`, 140, 40);

  const dateStr = order.createdAt ?
    (typeof order.createdAt.toDate === 'function' ? order.createdAt.toDate().toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()) :
    new Date().toLocaleDateString();

  docPdf.text(`Invoice Date: ${dateStr}`, 140, 45);
  docPdf.text(`Payment Status: ${order.paymentStatus || 'Paid'}`, 140, 50);

  // Customer Details
  docPdf.setFontSize(12);
  docPdf.setTextColor(0, 0, 0);
  docPdf.text("Billed To:", 14, 75);
  docPdf.setFontSize(10);
  docPdf.setTextColor(50, 50, 50);
  docPdf.text(`Client Name: ${order.userName || 'Client'}`, 14, 82);
  docPdf.text(`Email: ${order.userEmail || 'N/A'}`, 14, 87);
  docPdf.text(`Business Name: ${order.businessName || 'N/A'}`, 14, 92);

  let currentY = 97;
  if (order.userCity || order.userState) {
    const loc = [order.userCity, order.userState].filter(Boolean).join(", ");
    docPdf.text(`Location: ${loc}`, 14, currentY);
    currentY += 5;
  }
  if (order.businessGst) {
    docPdf.text(`GSTIN: ${order.businessGst}`, 14, currentY);
    currentY += 5;
  }

  // Table
  let periodStr = "N/A";
  if (order.taxYear) {
    periodStr = `Tax Year: ${order.taxYear}`;
  } else if (order.startMonth && order.startYear) {
    periodStr = `${order.startMonth} ${order.startYear} - ${order.endMonth} ${order.endYear}`;
  } else if (order.startDate && order.endDate) {
    periodStr = `${new Date(order.startDate).toLocaleDateString()} - ${new Date(order.endDate).toLocaleDateString()}`;
  }

  const tableData = [
    [
      order.serviceName || order.serviceSlug || "Service",
      order.planType || "One-time",
      periodStr,
      `Rs. ${order.basePrice?.toLocaleString() || order.amount?.toLocaleString() || "0"}`
    ]
  ];

  autoTable(docPdf, {
    startY: Math.max(110, currentY + 10),
    head: [['Description', 'Plan', 'Period', 'Base Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138] }
  });

  // Calculations
  const finalY = (docPdf as any).lastAutoTable.finalY || 130;

  docPdf.text(`Total Base Price: Rs. ${order.basePrice?.toLocaleString() || order.amount?.toLocaleString() || "0"}`, 140, finalY + 10);
  if (order.discountAmount > 0) {
    docPdf.setTextColor(16, 185, 129); // Green
    docPdf.text(`Discount Applied: - Rs. ${order.discountAmount?.toLocaleString()}`, 140, finalY + 17);
  }

  docPdf.setFontSize(12);
  docPdf.setTextColor(0, 0, 0);
  docPdf.setFont("helvetica", "bold");
  docPdf.text(`Total Paid: Rs. ${order.amount?.toLocaleString() || "0"}`, 140, finalY + 27);

  // Footer

  // Bank Details Left Bottom
  docPdf.setFontSize(10);
  docPdf.setFont("helvetica", "bold");
  docPdf.setTextColor(0, 0, 0);
  docPdf.text("Bank Details:", 14, 235);
  docPdf.setFont("helvetica", "normal");

  if (settings.bankDetails) {
    const bankLines = settings.bankDetails.split('\n');
    let bY = 240;
    bankLines.forEach((line: string) => {
      docPdf.text(line, 14, bY);
      bY += 5;
    });
  } else {
    docPdf.text("Bank Name: HDFC Bank", 14, 240);
    docPdf.text("Account No: 50200012345678", 14, 245);
    docPdf.text("IFSC Code: HDFC0001234", 14, 250);
  }

  docPdf.setFont("helvetica", "bold");
  docPdf.text(`For ${settings.companyName || 'NetProfit Pvt. Ltd.'}`, 140, 240);

  let imageLoaded = false;
  // Signatory Right Bottom
  if (settings.signatureType === 'image' && settings.signatureUrl) {
    const isBase64 = settings.signatureUrl.startsWith('data:image/');

    if (isBase64) {
      try {
        const imgType = settings.signatureUrl.includes('jpeg') || settings.signatureUrl.includes('jpg') ? 'JPEG' : 'PNG';
        docPdf.addImage(settings.signatureUrl, imgType, 140, 242, 40, 15);
        imageLoaded = true;
      } catch (err) {
        console.error("jsPDF addImage base64 error:", err);
      }
    } else {
      // Legacy URL handling
      try {
        const res = await fetch(settings.signatureUrl, { mode: 'cors' });
        const blob = await res.blob();
        const base64data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        const imgType = settings.signatureUrl.toLowerCase().includes('.jpg') || settings.signatureUrl.toLowerCase().includes('.jpeg') ? 'JPEG' : 'PNG';
        try {
          docPdf.addImage(base64data as string, imgType, 140, 242, 40, 15);
          imageLoaded = true;
        } catch (innerErr) {
          console.error("jsPDF addImage error:", innerErr);
        }
      } catch (e) {
        console.error("Error loading signature image via fetch, falling back to image tag", e);
        try {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.src = settings.signatureUrl;
          const loaded = await new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          });
          if (loaded) {
            const imgType = settings.signatureUrl.toLowerCase().includes('.jpg') || settings.signatureUrl.toLowerCase().includes('.jpeg') ? 'JPEG' : 'PNG';
            try {
              docPdf.addImage(img, imgType, 140, 242, 40, 15);
              imageLoaded = true;
            } catch (innerErr) {
              console.error("jsPDF addImage error:", innerErr);
            }
          }
        } catch (err2) { }
      }
    }
  }

  if (settings.signatureType === 'text' || (!settings.signatureType && !imageLoaded)) {
    // Fallback: draw initials or name in italic font to simulate handwriting
    const signText = settings.signatureText || (settings.companyName ? settings.companyName.split(' ')[0] : 'NetProfit');
    docPdf.setFont("times", "italic");
    docPdf.setFontSize(22);
    docPdf.setTextColor(12, 56, 102); // Dark blue ink color
    docPdf.text(signText, 140, 253);
    // Reset font back to normal for the rest of the document
    docPdf.setFontSize(10);
    docPdf.setTextColor(0, 0, 0);
  }

  docPdf.setFont("helvetica", "normal");
  docPdf.text("(Authorized Signatory)", 140, 262);

  docPdf.setFontSize(9);
  docPdf.setTextColor(100, 100, 100);
  docPdf.text("Thank you for your business!", 105, 275, { align: "center" });
  docPdf.text("This is a computer generated invoice and does not require a physical signature.", 105, 280, { align: "center" });

  docPdf.save(`Invoice_${finalPdfInvoiceNum}.pdf`);
};
