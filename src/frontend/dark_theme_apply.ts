import fs from 'fs';
import path from 'path';

function replaceAll(str: string, mapObj: Record<string, string>) {
    var re = new RegExp(Object.keys(mapObj).join("|"), "gi");
    return str.replace(re, function(matched){
        return mapObj[matched.toLowerCase()] || mapObj[matched];
    });
}

const colorMap = {
    'bg-slate-50': 'bg-[#111111]',
    'bg-white': 'bg-[#1C1C1E]',
    'text-slate-900': 'text-zinc-100',
    'text-slate-800': 'text-zinc-200',
    'text-slate-700': 'text-zinc-300',
    'text-slate-600': 'text-zinc-400',
    'text-slate-500': 'text-zinc-500',
    'text-slate-400': 'text-zinc-600',
    'border-slate-200': 'border-[#2C2C2E]',
    'border-slate-100': 'border-[#2C2C2E]',
    'border-slate-300': 'border-[#3C3C3E]',
    'bg-slate-100': 'bg-[#2C2C2E]',
    'bg-slate-200': 'bg-[#3A3A3C]',
    'hover:bg-slate-50': 'hover:bg-[#2C2C2E]',
    'hover:bg-slate-100': 'hover:bg-[#3A3A3C]',
    'hover:border-slate-300': 'hover:border-[#4C4C4E]',
    'ring-slate-200': 'ring-[#2C2C2E]',
    
    // Accents (Blue -> White/Gray)
    'bg-blue-600': 'bg-zinc-100',
    'text-blue-600': 'text-zinc-200',
    'text-blue-700': 'text-zinc-100',
    'text-blue-900': 'text-zinc-100',
    'border-blue-600': 'border-zinc-500',
    'bg-blue-50': 'bg-[#2C2C2E]',
    
    // Auth & Logo specifics
    'text-white': 'text-[#111111]', // specifically for the 'P' logo text inside white blob
};

function processFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // special cases
    if (filePath.endsWith('button.tsx')) {
        content = content.replace(/"bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600\/20 rounded-xl transition-all"/g, '"bg-zinc-100 text-[#111111] hover:bg-white shadow-md rounded-xl transition-all font-bold"');
        content = content.replace(/"border border-slate-200 bg-white hover:bg-slate-100 text-slate-900"/g, '"border border-[#2C2C2E] bg-[#1C1C1E] hover:bg-[#2C2C2E] text-zinc-100"');
        content = content.replace(/"bg-slate-100 text-slate-900 hover:bg-slate-200"/g, '"bg-[#2C2C2E] text-zinc-100 hover:bg-[#3A3A3C]"');
        content = content.replace(/"hover:bg-slate-100 hover:text-slate-900"/g, '"hover:bg-[#2C2C2E] hover:text-zinc-100 text-zinc-400"');
        fs.writeFileSync(filePath, content);
        return;
    }
    
    if (filePath.endsWith('input.tsx')) {
        content = content.replace(/bg-slate-50/g, 'bg-[#111111]');
        content = content.replace(/border-slate-200/g, 'border-[#2C2C2E]');
        content = content.replace(/text-slate-500/g, 'text-zinc-500');
        content = content.replace(/ring-offset-white/g, 'ring-offset-[#111111]');
        content = content.replace(/focus-visible:ring-blue-500\/20/g, 'focus-visible:ring-zinc-700');
        content = content.replace(/focus-visible:border-blue-500/g, 'focus-visible:border-zinc-600');
        content = content.replace(/text-sm/, 'text-sm text-zinc-100');
        fs.writeFileSync(filePath, content);
        return;
    }

    if (filePath.endsWith('label.tsx')) {
        content = content.replace(/text-slate-600/g, 'text-zinc-400');
        fs.writeFileSync(filePath, content);
        return;
    }

    if (filePath.endsWith('card.tsx')) {
        content = content.replace(/bg-white/g, 'bg-[#1C1C1E]');
        content = content.replace(/border-slate-200/g, 'border-[#2C2C2E]');
        content = content.replace(/text-slate-950/g, 'text-zinc-100');
        content = content.replace(/text-slate-500/g, 'text-zinc-400');
        fs.writeFileSync(filePath, content);
        return;
    }

    let modified = replaceAll(content, colorMap);
    
    // fix some text colors inside bg-zinc-100 (which used to be bg-blue-600)
    modified = modified.replace(/<span className="text-\[#111111\] font-bold text-sm">P<\/span>/g, '<span className="text-[#111111] font-bold text-sm">P</span>');
    modified = modified.replace(/<div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-\[#111111\] font-bold\">P/g, '<div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-[#111111] font-bold">P');

    if (filePath.endsWith('index.css')) {
        modified = modified.replace(/theme\('colors.slate.50'\)/, "'#111111'");
        modified = modified.replace(/theme\('colors.slate.900'\)/, "theme('colors.zinc.100')");
    }

    fs.writeFileSync(filePath, modified);
}

function processDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
      processFile(fullPath);
    }
  }
}

// Ensure components ui are updated
processFile('./src/components/ui/button.tsx');
processFile('./src/components/ui/input.tsx');
processFile('./src/components/ui/label.tsx');
processFile('./src/components/ui/card.tsx');

// Process pages and layouts
processDirectory('./src/pages');
processDirectory('./src/layouts');
processFile('./src/index.css');
