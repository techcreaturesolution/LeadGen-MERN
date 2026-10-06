import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const dirToWalk = 'C:\\Users\\Admin\\Desktop\\my_projects\\LeadGen-MERN\\client\\src';

walkDir(dirToWalk, (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/text-blue-700/g, 'text-[#008762]');
    content = content.replace(/text-blue-600/g, 'text-[#008762]');
    content = content.replace(/text-blue-900/g, 'text-[#006e50]');
    content = content.replace(/bg-blue-700/g, 'bg-[#008762]');
    content = content.replace(/bg-blue-600/g, 'bg-[#008762]');
    content = content.replace(/bg-blue-50/g, 'bg-[#008762]/10');
    content = content.replace(/border-blue-700/g, 'border-[#008762]');
    content = content.replace(/border-blue-600/g, 'border-[#008762]');
    content = content.replace(/focus:border-blue-600/g, 'focus:border-[#008762]');
    content = content.replace(/focus:ring-blue-100/g, 'focus:ring-[#008762]\\/20');
    content = content.replace(/ring-blue-600/g, 'ring-[#008762]');
    content = content.replace(/hover:text-blue-800/g, 'hover:text-[#006e50]');
    content = content.replace(/hover:bg-blue-800/g, 'hover:bg-[#006e50]');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', filePath);
    }
  }
});
