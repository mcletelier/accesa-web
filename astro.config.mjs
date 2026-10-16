// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://accesa.agency',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Mantiene los espacios entre elementos en línea igual que el sitio original
  compressHTML: true,
});
