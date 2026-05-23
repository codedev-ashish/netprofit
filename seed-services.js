const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Manual dotenv parser for .env.local
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[key] = value;
  }
});

const firebaseConfig = {
  apiKey: envVars['NEXT_PUBLIC_FIREBASE_API_KEY'],
  authDomain: envVars['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
  projectId: envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
  storageBucket: envVars['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: envVars['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  appId: envVars['NEXT_PUBLIC_FIREBASE_APP_ID'],
  measurementId: envVars['NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'],
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const services = [
  {
    name: "Private Limited Company Registration",
    category: "Corporate Services",
    description: "Register your Private Limited Company with full compliance and expert support.",
    period: "One-time",
    isRecurring: false,
    price: 4999
  },
  {
    name: "Limited Liability Partnership (LLP)",
    category: "Corporate Services",
    description: "Register an LLP with minimal compliance requirements.",
    period: "One-time",
    isRecurring: false,
    price: 3999
  },
  {
    name: "One Person Company (OPC)",
    category: "Corporate Services",
    description: "Start your business as a single founder with limited liability.",
    period: "One-time",
    isRecurring: false,
    price: 4499
  },
  {
    name: "FSSAI Food License",
    category: "Licensing Services",
    description: "Get your food business FSSAI registered legally and easily.",
    period: "Annual",
    isRecurring: true,
    price: 1999
  },
  {
    name: "Trade License",
    category: "Licensing Services",
    description: "Obtain your mandatory municipal trade license.",
    period: "Annual",
    isRecurring: true,
    price: 2499
  },
  {
    name: "MSME Registration",
    category: "Licensing Services",
    description: "Udyam Registration to unlock government benefits for small businesses.",
    period: "One-time",
    isRecurring: false,
    price: 999
  },
  {
    name: "Trademark Registration",
    category: "Legal Services",
    description: "Protect your brand name and logo from being copied.",
    period: "One-time",
    isRecurring: false,
    price: 5999
  },
  {
    name: "GST Registration",
    category: "Accounting & Taxation",
    description: "100% online GSTIN registration process.",
    period: "One-time",
    isRecurring: false,
    price: 1499
  },
  {
    name: "GST Return Filing",
    category: "Accounting & Taxation",
    description: "Monthly/Quarterly GST return filing by expert CAs.",
    period: "Monthly",
    isRecurring: true,
    price: 999
  },
  {
    name: "Income Tax Filing (ITR)",
    category: "Accounting & Taxation",
    description: "File your ITR accurately and claim maximum refunds.",
    period: "Annual",
    isRecurring: true,
    price: 1499
  },
  {
    name: "Digital Signature Certificate (DSC)",
    category: "Other Services",
    description: "Get Class 3 DSC for e-filing and compliance.",
    period: "2 Years",
    isRecurring: true,
    price: 1999
  }
];

async function seedServices() {
  console.log("Starting to seed services to Firestore...");
  let count = 0;
  for (const service of services) {
    try {
      const docRef = await addDoc(collection(db, "services"), {
        ...service,
        createdAt: serverTimestamp()
      });
      console.log(`Added service: ${service.name} (ID: ${docRef.id})`);
      count++;
    } catch (e) {
      console.error(`Error adding service: ${service.name}`, e);
    }
  }
  console.log(`Successfully seeded ${count}/${services.length} services.`);
  process.exit(0);
}

seedServices();
