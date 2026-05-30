import { doc, getDoc, getDocs, collection, addDoc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db as firebaseDb } from '../firebase';

let cachedDbSettings: any = null;
let mysqlPool: any = null;
let pgPool: any = null;
let mongoClient: any = null;

// Fetch settings from Firestore
async function getDbSettings() {
  if (cachedDbSettings) return cachedDbSettings;
  try {
    const docSnap = await getDoc(doc(firebaseDb, "settings", "database"));
    if (docSnap.exists()) {
      cachedDbSettings = docSnap.data();
      return cachedDbSettings;
    }
  } catch (e) {
    console.error("Error fetching db settings:", e);
  }
  return { activeDb: 'firebase' };
}

// Get MySQL connection pool
async function getMysqlPool(settings: any) {
  if (mysqlPool) return mysqlPool;
  const mysql = await import('mysql2/promise');
  mysqlPool = mysql.createPool({
    host: settings.host || 'localhost',
    port: parseInt(settings.port || '3306'),
    user: settings.username || 'root',
    password: settings.password || '',
    database: settings.dbName || 'netprofit',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  return mysqlPool;
}

// Get PostgreSQL connection pool
async function getPgPool(settings: any) {
  if (pgPool) return pgPool;
  const { Pool } = await import('pg');
  pgPool = new Pool({
    host: settings.host || 'localhost',
    port: parseInt(settings.port || '5432'),
    user: settings.username || 'root',
    password: settings.password || '',
    database: settings.dbName || 'netprofit',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  });
  return pgPool;
}

// Get MongoDB client
async function getMongoClient(settings: any) {
  if (mongoClient) return mongoClient;
  const { MongoClient } = await import('mongodb');
  mongoClient = new MongoClient(settings.connectionString || 'mongodb://localhost:27017');
  await mongoClient.connect();
  return mongoClient;
}

export const dbAdapter = {
  // Get all documents from a collection
  async getDocuments(colName: string): Promise<any[]> {
    const settings = await getDbSettings();
    const activeDb = settings.activeDb || 'firebase';

    if (activeDb === 'mysql') {
      const pool = await getMysqlPool(settings);
      const [rows] = await pool.query(`SELECT * FROM \`${colName}\``);
      return rows as any[];
    }

    if (activeDb === 'postgresql') {
      const pool = await getPgPool(settings);
      const res = await pool.query(`SELECT * FROM "${colName}"`);
      return res.rows;
    }

    if (activeDb === 'mongodb') {
      const client = await getMongoClient(settings);
      const db = client.db(settings.dbName || 'netprofit');
      const docs = await db.collection(colName).find({}).toArray();
      return docs.map((d: any) => ({ ...d, id: d._id?.toString() }));
    }

    // Default: Firebase
    const colRef = collection(firebaseDb, colName);
    const snapshot = await getDocs(colRef);
    const results: any[] = [];
    snapshot.forEach(doc => {
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  },

  // Get a single document by ID
  async getDocument(colName: string, id: string): Promise<any | null> {
    const settings = await getDbSettings();
    const activeDb = settings.activeDb || 'firebase';

    if (activeDb === 'mysql') {
      const pool = await getMysqlPool(settings);
      const [rows]: any = await pool.query(`SELECT * FROM \`${colName}\` WHERE id = ?`, [id]);
      return rows.length > 0 ? rows[0] : null;
    }

    if (activeDb === 'postgresql') {
      const pool = await getPgPool(settings);
      const res = await pool.query(`SELECT * FROM "${colName}" WHERE id = $1`, [id]);
      return res.rows.length > 0 ? res.rows[0] : null;
    }

    if (activeDb === 'mongodb') {
      const client = await getMongoClient(settings);
      const db = client.db(settings.dbName || 'netprofit');
      const docVal = await db.collection(colName).findOne({ _id: id as any });
      return docVal ? { ...docVal, id: docVal._id?.toString() } : null;
    }

    // Default: Firebase
    const docSnap = await getDoc(doc(firebaseDb, colName, id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  // Add a new document
  async addDocument(colName: string, data: any): Promise<any> {
    const settings = await getDbSettings();
    const activeDb = settings.activeDb || 'firebase';
    const id = data.id || Math.random().toString(36).substring(2, 15);

    if (activeDb === 'mysql') {
      const pool = await getMysqlPool(settings);
      const keys = Object.keys(data);
      const fields = keys.map(k => `\`${k}\``).join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(k => data[k]);
      
      await pool.query(`INSERT INTO \`${colName}\` (${fields}) VALUES (${placeholders})`, values);
      return { id, ...data };
    }

    if (activeDb === 'postgresql') {
      const pool = await getPgPool(settings);
      const keys = Object.keys(data);
      const fields = keys.map(k => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const values = keys.map(k => data[k]);

      await pool.query(`INSERT INTO "${colName}" (${fields}) VALUES (${placeholders})`, values);
      return { id, ...data };
    }

    if (activeDb === 'mongodb') {
      const client = await getMongoClient(settings);
      const db = client.db(settings.dbName || 'netprofit');
      const insertData = { _id: id, ...data };
      await db.collection(colName).insertOne(insertData);
      return { id, ...data };
    }

    // Default: Firebase
    const colRef = collection(firebaseDb, colName);
    const docRef = await addDoc(colRef, data);
    return { id: docRef.id, ...data };
  },

  // Update an existing document
  async updateDocument(colName: string, id: string, data: any): Promise<void> {
    const settings = await getDbSettings();
    const activeDb = settings.activeDb || 'firebase';

    if (activeDb === 'mysql') {
      const pool = await getMysqlPool(settings);
      const keys = Object.keys(data);
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = [...keys.map(k => data[k]), id];

      await pool.query(`UPDATE \`${colName}\` SET ${setClause} WHERE id = ?`, values);
      return;
    }

    if (activeDb === 'postgresql') {
      const pool = await getPgPool(settings);
      const keys = Object.keys(data);
      const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
      const values = [...keys.map(k => data[k]), id];

      await pool.query(`UPDATE "${colName}" SET ${setClause} WHERE id = $${keys.length + 1}`, values);
      return;
    }

    if (activeDb === 'mongodb') {
      const client = await getMongoClient(settings);
      const db = client.db(settings.dbName || 'netprofit');
      await db.collection(colName).updateOne({ _id: id as any }, { $set: data });
      return;
    }

    // Default: Firebase
    const docRef = doc(firebaseDb, colName, id);
    await updateDoc(docRef, data);
  },

  // Delete a document
  async deleteDocument(colName: string, id: string): Promise<void> {
    const settings = await getDbSettings();
    const activeDb = settings.activeDb || 'firebase';

    if (activeDb === 'mysql') {
      const pool = await getMysqlPool(settings);
      await pool.query(`DELETE FROM \`${colName}\` WHERE id = ?`, [id]);
      return;
    }

    if (activeDb === 'postgresql') {
      const pool = await getPgPool(settings);
      await pool.query(`DELETE FROM "${colName}" WHERE id = $1`, [id]);
      return;
    }

    if (activeDb === 'mongodb') {
      const client = await getMongoClient(settings);
      const db = client.db(settings.dbName || 'netprofit');
      await db.collection(colName).deleteOne({ _id: id as any });
      return;
    }

    // Default: Firebase
    const docRef = doc(firebaseDb, colName, id);
    await deleteDoc(docRef);
  }
};
