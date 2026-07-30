import { db } from "./src/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

async function fixNoIndex() {
  const docsToCheck = [
    { collection: "settings", id: "ads" },
    { collection: "settings", id: "global" },
    { collection: "settings", id: "header_footer" }
  ];

  for (const item of docsToCheck) {
    const docRef = doc(db, item.collection, item.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let updated = false;
      
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string" && value.includes("noindex")) {
          console.log(`Found 'noindex' in ${item.collection}/${item.id} -> field: ${key}`);
          data[key] = value.replace(/noindex/gi, "index");
          updated = true;
        }
      }
      
      if (updated) {
        await updateDoc(docRef, data);
        console.log(`Updated ${item.collection}/${item.id} successfully!`);
      }
    }
  }
  
  console.log("Done checking settings.");
  process.exit(0);
}

fixNoIndex().catch(console.error);
