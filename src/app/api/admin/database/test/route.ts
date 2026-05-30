import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { activeDb, host, port, dbName, username, password, connectionString } = await req.json();

    if (activeDb === 'mysql') {
      const mysql = await import('mysql2/promise');
      try {
        const connection = await mysql.createConnection({
          host,
          port: parseInt(port || '3306'),
          user: username,
          password: password,
          database: dbName,
          connectTimeout: 5000
        });
        await connection.end();
        return NextResponse.json({ success: true });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `MySQL Connection Failed: ${err.message}` }, { status: 400 });
      }
    }

    if (activeDb === 'postgresql') {
      const { Client } = await import('pg');
      try {
        const client = new Client({
          host,
          port: parseInt(port || '5432'),
          user: username,
          password: password,
          database: dbName,
          connectionTimeoutMillis: 5000
        });
        await client.connect();
        await client.end();
        return NextResponse.json({ success: true });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `PostgreSQL Connection Failed: ${err.message}` }, { status: 400 });
      }
    }

    if (activeDb === 'mongodb') {
      const { MongoClient } = await import('mongodb');
      try {
        const client = new MongoClient(connectionString || 'mongodb://localhost:27017', {
          serverSelectionTimeoutMS: 5000
        });
        await client.connect();
        await client.close();
        return NextResponse.json({ success: true });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: `MongoDB Connection Failed: ${err.message}` }, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, error: 'Unsupported database type' }, { status: 400 });
  } catch (error: any) {
    console.error('Test Connection error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
