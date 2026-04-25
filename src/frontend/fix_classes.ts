import fs from 'fs';

let content = fs.readFileSync('src/pages/setup/SetupSteps.tsx', 'utf-8');
content = content.replace(/bg-blue-100/g, 'bg-zinc-800');
content = content.replace(/bg-blue-800/g, 'bg-zinc-900');
content = content.replace(/text-blue-800/g, 'text-zinc-100');
content = content.replace(/border-blue-\d00/g, 'border-zinc-700');
content = content.replace(/hover:bg-blue-700/g, 'hover:bg-zinc-200');
content = content.replace(/bg-blue-200\/50/g, 'bg-zinc-800\/50');
content = content.replace(/shadow-blue-600\/30/g, 'shadow-zinc-800\/30');
content = content.replace(/border-blue-100\/50/g, 'border-zinc-800\/50');
content = content.replace(/bg-blue-200/g, 'bg-zinc-800');
fs.writeFileSync('src/pages/setup/SetupSteps.tsx', content);

let loginContent = fs.readFileSync('src/pages/Login.tsx', 'utf-8');
loginContent = loginContent.replace(/hover:text-blue-500/g, 'hover:text-zinc-400');
loginContent = loginContent.replace(/focus:ring-blue-500/g, 'focus:ring-zinc-400');
fs.writeFileSync('src/pages/Login.tsx', loginContent);
