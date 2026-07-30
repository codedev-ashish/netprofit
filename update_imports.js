const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  // Skip the firebase files themselves
  if (filePath.includes('firebase.ts') || filePath.includes('firebase-auth.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We are looking for: import { auth, db } from ".../lib/firebase"
  // or: import { db, auth } from ".../lib/firebase"
  // or: import { auth } from ".../lib/firebase"
  
  // Replace `import { auth } from "..."` with `import { auth } from ".../firebase-auth"`
  // Replace `import { auth, db }` with `import { db } from "..."; import { auth } from ".../firebase-auth";`
  
  // A regex to match imports from any relative path to firebase
  const regex = /import\s+\{([^}]+)\}\s+from\s+["']([^"']+)firebase["'];/g;
  
  content = content.replace(regex, (match, imports, prefix) => {
    const importItems = imports.split(',').map(s => s.trim());
    if (importItems.includes('auth')) {
      const otherItems = importItems.filter(i => i !== 'auth');
      let newImport = '';
      if (otherItems.length > 0) {
        newImport += `import { ${otherItems.join(', ')} } from "${prefix}firebase";\n`;
      }
      newImport += `import { auth } from "${prefix}firebase-auth";`;
      return newImport;
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
});
