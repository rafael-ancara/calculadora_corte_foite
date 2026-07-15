import fs from 'fs';
import path from 'path';

console.log('--- Running definitive prebuild case-sensitivity fix ---');

try {
  // 1. Rename any variant of 'src' folder (e.g. SRC, Src) to lowercase 'src'
  const rootItems = fs.readdirSync('.');
  const srcDir = rootItems.find(item => item.toLowerCase() === 'src' && fs.statSync(item).isDirectory());
  
  if (srcDir && srcDir !== 'src') {
    console.log(`Fixing casing: Renaming directory '${srcDir}' to 'src'`);
    // Rename to a temp name first to avoid issues on case-insensitive filesystems
    fs.renameSync(srcDir, 'src_temp_casing_fix');
    fs.renameSync('src_temp_casing_fix', 'src');
  } else if (!srcDir) {
    console.log('Warning: No "src" directory found in root.');
  }

  // 2. Rename main entry files inside src to lowercase if needed
  if (fs.existsSync('src')) {
    const srcItems = fs.readdirSync('src');
    
    // Check main.tsx
    const mainFile = srcItems.find(item => item.toLowerCase() === 'main.tsx');
    if (mainFile && mainFile !== 'main.tsx') {
      console.log(`Fixing casing: Renaming file '${mainFile}' to 'main.tsx'`);
      fs.renameSync(path.join('src', mainFile), path.join('src', 'main.tsx'));
    }
    
    // Check index.css
    const indexCssFile = srcItems.find(item => item.toLowerCase() === 'index.css');
    if (indexCssFile && indexCssFile !== 'index.css') {
      console.log(`Fixing casing: Renaming file '${indexCssFile}' to 'index.css'`);
      fs.renameSync(path.join('src', indexCssFile), path.join('src', 'index.css'));
    }
  }

  // 3. Normalize index.html references to use absolute-like path '/src/main.tsx'
  if (fs.existsSync('index.html')) {
    let htmlContent = fs.readFileSync('index.html', 'utf8');
    if (htmlContent.includes('./src/main.tsx')) {
      console.log('Normalizing index.html script tag from ./src/main.tsx to /src/main.tsx');
      htmlContent = htmlContent.replace('./src/main.tsx', '/src/main.tsx');
      fs.writeFileSync('index.html', htmlContent, 'utf8');
    }
  }
  
  console.log('--- Prebuild case-sensitivity fix completed successfully ---');
} catch (error) {
  console.error('Error in prebuild casing script:', error);
}
