import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedDefaultServices = async () => {
  const defaultServices = [
    // Registration
    { name: "GST Registration", category: "Registration", period: "one-time", isRecurring: false, description: "Register for GST seamlessly." },
    { name: "MSME Registration", category: "Registration", period: "one-time", isRecurring: false, description: "Get your MSME certificate." },
    { name: "TAN Registration", category: "Registration", period: "one-time", isRecurring: false, description: "Tax Deduction and Collection Account Number registration." },
    { name: "Company Registration", category: "Registration", period: "one-time", isRecurring: false, description: "Private Limited / LLP Company Registration." },
    { name: "EPF & ESI Registration", category: "Registration", period: "one-time", isRecurring: false, description: "Employee Provident Fund & State Insurance Registration." },
    // Filing Returns
    { name: "GST Return", category: "Filing Returns", period: "monthly", isRecurring: true, description: "Monthly GST return filing." },
    { name: "ITR Filing", category: "Filing Returns", period: "yearly", isRecurring: true, description: "Annual Income Tax Return." },
    { name: "TDS & TCS Return", category: "Filing Returns", period: "quarterly", isRecurring: true, description: "Quarterly TDS & TCS return filing." },
    { name: "PF & ESI Return", category: "Filing Returns", period: "monthly", isRecurring: true, description: "Monthly PF & ESI return filing." },
    // Accounting
    { name: "Prepare Books", category: "Accounting", period: "monthly", isRecurring: true, description: "Monthly bookkeeping and accounting." },
    { name: "Audit Finalization", category: "Accounting", period: "yearly", isRecurring: true, description: "Annual audit preparation and finalization." },
    { name: "Ledger Reconciliation", category: "Accounting", period: "monthly", isRecurring: true, description: "Reconciliation of business ledgers." },
    { name: "E-Invoicing & E-way Bill", category: "Accounting", period: "monthly", isRecurring: true, description: "Generation of E-invoices and E-way bills." },
    // Compliance
    { name: "Wages Sheet", category: "Compliance", period: "monthly", isRecurring: true, description: "Monthly payroll and wages sheet preparation." },
    { name: "Muster Roll", category: "Compliance", period: "monthly", isRecurring: true, description: "Maintenance of employee muster roll." },
    { name: "PF & ESI Sheet", category: "Compliance", period: "monthly", isRecurring: true, description: "Preparation of PF and ESI contribution sheets." }
  ];

  console.log("Starting to seed database...");
  for (const s of defaultServices) {
    await addDoc(collection(db, "services"), s);
    console.log(`Added service: ${s.name}`);
  }
  console.log("Successfully seeded all services into Firestore!");
  process.exit(0);
};

seedDefaultServices().catch(err => {
  console.error("Error seeding:", err);
  process.exit(1);
});
