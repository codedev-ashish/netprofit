import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "../../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { businessName, serviceName, taxYear, period, returnType, userName, fileCount, userId, businessId, serviceSlug, plan } = await req.json();

    // 1. Add alert to Firestore admin_alerts collection
    await addDoc(collection(db, "admin_alerts"), {
      title: "New Documents Uploaded",
      message: `${userName || 'A user'} uploaded ${fileCount} document(s) for ${serviceName} (${businessName}).`,
      businessName,
      serviceName,
      taxYear,
      period,
      returnType,
      plan: plan || null,
      type: 'document_upload',
      read: false,
      link: userId && businessId && serviceSlug ? `/admin/users/${userId}/businesses/${businessId}/services/${serviceSlug}` : null,
      createdAt: serverTimestamp()
    });

    // Try to send email via SMTP (if configured)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

      let subject = `New Document Uploaded by ${userName || 'a User'} - ${businessName}`;
      let messageHtml = `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #111827;">New Documents Uploaded</h2>
          <p>A user has just uploaded <strong>${fileCount} document(s)</strong> for a service request. Please review them in the Admin Panel.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; width: 150px;">Business</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${businessName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold;">Service</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold;">Tax Year</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${taxYear || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold;">Period</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${period || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold;">Return Type</td>
              <td style="padding: 10px; border: 1px solid #e5e7eb;">${returnType || 'N/A'}</td>
            </tr>
          </table>
          
          <p style="margin-top: 20px;">Log in to the Admin Dashboard > <strong>Service Requests</strong> to view and process these files.</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"NetProfit Alerts" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: subject,
        html: messageHtml,
      });
      
      console.log("Admin upload alert email sent successfully.");
    } else {
      console.log("SMTP not configured. Skipping admin upload alert email.");
    }

    return NextResponse.json({ success: true, message: "Alert processed" });
  } catch (error: any) {
    console.error("Notify Admin API error:", error);
    // Even if it fails, we shouldn't break the user's flow, so return 200 with an error note
    return NextResponse.json({ success: false, error: error.message });
  }
}
