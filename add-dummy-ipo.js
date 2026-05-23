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

async function addDummyIPO() {
  try {
    const docRef = await addDoc(collection(db, "ipos"), {
      name: "Dummy Initial IPO",
      symbol: "DUMMY",
      type: "Mainboard",
      status: "Upcoming",
      description: "This is a system-generated dummy IPO to initialize the 'ipos' collection.",
      priceBandLow: 100,
      priceBandHigh: 120,
      faceValue: 10,
      lotSize: 100,
      issueSize: 500,
      timeline: {
        openDate: "2026-06-01",
        closeDate: "2026-06-03",
        basisOfAllotment: "2026-06-04",
        listingDate: "2026-06-08"
      },
      financials: [
        { year: "FY25", revenue: 1000, profit: 200, assets: 5000 }
      ],
      createdAt: serverTimestamp()
    });
    console.log("Document written with ID: ", docRef.id);
    console.log("Success! The 'ipos' collection is now visible in Firebase console.");
    process.exit(0);
  } catch (e) {
    console.error("Error adding document: ", e);
    process.exit(1);
  }
}

addDummyIPO();
