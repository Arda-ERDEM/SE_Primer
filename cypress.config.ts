import { defineConfig } from 'cypress';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  viewportWidth: 390,
  viewportHeight: 844,
  video: true,
  videoCompression: false,
  screenshotOnRunFailure: true,
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on) {
      on('after:screenshot', (details) => {
        const targetDir = path.join(process.cwd(), 'stitch-screens');
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const baseName = path.basename(details.path);
        if (
          baseName === '01-giris-ekrani.png' ||
          baseName === '02-kriz-sahnesi.png' ||
          baseName === '03-sonuc-raporu.png'
        ) {
          const destPath = path.join(targetDir, baseName);
          fs.copyFileSync(details.path, destPath);
          return { path: destPath };
        }
      });
    },
  },
});
