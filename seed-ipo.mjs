import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

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

const seedIPO = async () => {
  console.log("Creating IPO collection in Firestore...");
  try {
    const docRef = await addDoc(collection(db, "ipos"), {
      name: "Sample Initial IPO",
      symbol: "SAMPLE",
      status: "Upcoming",
      type: "Mainboard",
      description: "This is a sample IPO to initialize the database collection.",
      isVisible: true,
      priceBandLow: 100,
      priceBandHigh: 120,
      createdAt: serverTimestamp()
    });
    console.log(`Created sample IPO document with ID: ${docRef.id}`);
    
    // We can leave it there as a test document so they see it in the UI.
    console.log("Firestore 'ipos' table successfully created.");
  } catch (error) {
    console.error("Error creating IPO table:", error);
  }
  process.exit(0);
};

seedIPO();
