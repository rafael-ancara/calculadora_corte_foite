import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function caseInsensitiveResolverPlugin(): Plugin {
  return {
    name: 'case-insensitive-resolver',
    
    // 1. Intercept and fix the script tags in index.html to match actual casing on disk
    transformIndexHtml(html) {
      const root = process.cwd();
      const files = fs.readdirSync(root);
      const actualSrcDir = files.find(f => f.toLowerCase() === 'src') || 'src';
      
      let actualMainFile = 'main.tsx';
      const srcPath = path.join(root, actualSrcDir);
      if (fs.existsSync(srcPath)) {
        const srcFiles = fs.readdirSync(srcPath);
        actualMainFile = srcFiles.find(f => f.toLowerCase() === 'main.tsx') || 'main.tsx';
      }
      
      const targetPath = `/${actualSrcDir}/${actualMainFile}`;
      console.log(`[case-insensitive-resolver] Rewriting index.html script tag to: ${targetPath}`);
      
      // Replaces any variations like src/main.tsx or ./src/main.tsx with case-insensitive regex
      return html.replace(
        /src\s*=\s*["'](?:\.?\/)?[Ss][Rr][Cc]\/[Mm][Aa][Ii][Nn]\.[Tt][Ss][Xx]["']/g,
        `src="${targetPath}"`
      );
    },
    
    // 2. Custom resolution hook to resolve case-insensitive imports
    resolveId(source, importer) {
      const isRelative = source.startsWith('.') || source.startsWith('/');
      const isSrcPrefix = source.toLowerCase().startsWith('src/');
      
      if (!isRelative && !isSrcPrefix) {
        return null; // Let other plugins handle node_modules etc.
      }
      
      const root = process.cwd();
      let basePath = root;
      
      if (isRelative && importer) {
        basePath = path.dirname(importer);
      }
      
      let parts: string[] = [];
      if (isSrcPrefix) {
        const files = fs.readdirSync(root);
        const actualSrcDir = files.find(f => f.toLowerCase() === 'src') || 'src';
        basePath = root;
        parts = [actualSrcDir, ...source.replace(/^src\//i, '').split('/')];
      } else if (source.startsWith('/')) {
        parts = source.slice(1).split('/');
      } else {
        parts = source.split('/');
      }
      
      let currentPath = basePath;
      let resolvedSuccessfully = true;
      const resolvedParts: string[] = [];
      
      for (const part of parts) {
        if (!part || part === '.') {
          if (part === '.') resolvedParts.push('.');
          continue;
        }
        if (part === '..') {
          currentPath = path.dirname(currentPath);
          resolvedParts.push('..');
          continue;
        }
        
        if (fs.existsSync(currentPath)) {
          const files = fs.readdirSync(currentPath);
          // Find case-insensitive match
          const match = files.find(f => {
            const lowF = f.toLowerCase();
            const lowPart = part.toLowerCase();
            return lowF === lowPart || 
                   lowF === `${lowPart}.tsx` || 
                   lowF === `${lowPart}.ts` || 
                   lowF === `${lowPart}.jsx` || 
                   lowF === `${lowPart}.js`;
          });
          
          if (match) {
            currentPath = path.join(currentPath, match);
            resolvedParts.push(match);
          } else {
            resolvedSuccessfully = false;
            break;
          }
        } else {
          resolvedSuccessfully = false;
          break;
        }
      }
      
      if (resolvedSuccessfully) {
        const finalResolved = path.resolve(basePath, ...resolvedParts);
        if (fs.existsSync(finalResolved) && !fs.statSync(finalResolved).isDirectory()) {
          return finalResolved;
        }
      }
      
      return null;
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), caseInsensitiveResolverPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
