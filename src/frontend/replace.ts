import fs from 'fs';
import path from 'path';

function replaceInFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/teal-/g, 'blue-');
  content = content.replace(/bg-teal/g, 'bg-blue');
  content = content.replace(/text-teal/g, 'text-blue');
  content = content.replace(/border-teal/g, 'border-blue');
  content = content.replace(/ring-teal/g, 'ring-blue');
  content = content.replace(/shadow-teal/g, 'shadow-blue');
  
  if (filePath.endsWith('Dashboard.tsx')) {
    content = content.replace(/#14b8a6/g, '#2563eb');
    content = content.replace(/bg-blue-500/g, 'bg-blue-600');
  }
  
  if (filePath.endsWith('SetupSteps.tsx')) {
    content = content.replace(/<h2 className="text-2xl font-bold/g, '<h2 className="text-3xl font-extrabold');
  }
  
  fs.writeFileSync(filePath, content);
}

function processDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

processDirectory('./src/pages');
processDirectory('./src/layouts');
