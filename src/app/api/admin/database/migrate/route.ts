import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper to escape values for SQL
function escapeSQL(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'object') {
    // If it's a Firestore Timestamp
    if (value.seconds !== undefined) {
      return `'${new Date(value.seconds * 1000).toISOString().slice(0, 19).replace('T', ' ')}'`;
    }
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return `'${value.toString().replace(/'/g, "''")}'`;
}

// Map JavaScript types to SQL columns
function getColumnsAndTypes(sampleDoc: any): { name: string; mysqlType: string; pgType: string }[] {
  const columns: { name: string; mysqlType: string; pgType: string }[] = [
    { name: 'id', mysqlType: 'VARCHAR(255) PRIMARY KEY', pgType: 'VARCHAR(255) PRIMARY KEY' }
  ];

  for (const key of Object.keys(sampleDoc)) {
    if (key === 'id') continue;
    const val = sampleDoc[key];
    let mysqlType = 'TEXT';
    let pgType = 'TEXT';

    if (typeof val === 'number') {
      mysqlType = 'DOUBLE';
      pgType = 'DOUBLE PRECISION';
    } else if (typeof val === 'boolean') {
      mysqlType = 'TINYINT(1)';
      pgType = 'BOOLEAN';
    } else if (val && typeof val === 'object' && val.seconds !== undefined) {
      mysqlType = 'DATETIME';
      pgType = 'TIMESTAMP';
    }

    columns.push({ name: key, mysqlType, pgType });
  }

  return columns;
}

export async function GET() {
  try {
    const collectionsToExport = [
      'users',
      'businesses',
      'service_requests',
      'documents',
      'user_subscriptions',
      'notifications',
      'rectification_requests'
    ];

    let sqlOutput = `-- =========================================================\n`;
    sqlOutput += `-- NETPROFIT DATABASE CONVERSION & DUMP\n`;
    sqlOutput += `-- Generated on ${new Date().toISOString()}\n`;
    sqlOutput += `-- Compatible with MySQL & PostgreSQL\n`;
    sqlOutput += `-- =========================================================\n\n`;

    for (const colName of collectionsToExport) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      const docs: any[] = [];
      snapshot.forEach(d => docs.push({ id: d.id, ...d.data() }));

      if (docs.length === 0) {
        continue;
      }

      // Sample a document to determine schema
      const sample = docs[0];
      const cols = getColumnsAndTypes(sample);

      // 1. Write MySQL Schema
      sqlOutput += `-- ---------------------------------------------------------\n`;
      sqlOutput += `-- MySQL Table Structure for: ${colName}\n`;
      sqlOutput += `-- ---------------------------------------------------------\n`;
      sqlOutput += `DROP TABLE IF EXISTS \`${colName}\`;\n`;
      sqlOutput += `CREATE TABLE \`${colName}\` (\n`;
      sqlOutput += cols.map(c => `  \`${c.name}\` ${c.mysqlType}`).join(',\n');
      sqlOutput += `\n);\n\n`;

      // 2. Write PostgreSQL Schema (commented out in same file, or side-by-side)
      sqlOutput += `-- ---------------------------------------------------------\n`;
      sqlOutput += `-- PostgreSQL Table Structure for: ${colName}\n`;
      sqlOutput += `-- ---------------------------------------------------------\n`;
      sqlOutput += `-- DROP TABLE IF EXISTS "${colName}" CASCADE;\n`;
      sqlOutput += `-- CREATE TABLE "${colName}" (\n`;
      sqlOutput += cols.map(c => `--   "${c.name}" ${c.pgType}`).join(',\n');
      sqlOutput += `\n-- );\n\n`;

      // 3. Write INSERT INTO statements for MySQL
      sqlOutput += `-- ---------------------------------------------------------\n`;
      sqlOutput += `-- Data Insertions for: ${colName}\n`;
      sqlOutput += `-- ---------------------------------------------------------\n`;
      for (const d of docs) {
        const colNames = cols.map(c => `\`${c.name}\``).join(', ');
        const values = cols.map(c => escapeSQL(d[c.name])).join(', ');
        sqlOutput += `INSERT INTO \`${colName}\` (${colNames}) VALUES (${values});\n`;
      }
      sqlOutput += `\n\n`;
    }

    // Return the generated SQL as a downloadable attachment
    return new Response(sqlOutput, {
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': 'attachment; filename="netprofit_db_dump.sql"',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
