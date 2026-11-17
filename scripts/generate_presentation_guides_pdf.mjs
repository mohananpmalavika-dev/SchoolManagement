import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function generateGuides() {
  console.log('Launching browser to render PDFs...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Regular School Presentation Guide
  const regularHtmlPath = resolve('c:/SchoolManagement/KRYPTON_REGULAR_SCHOOL_PRESENTATION_GUIDE.html');
  const regularPdfPath = resolve('c:/SchoolManagement/KRYPTON_REGULAR_SCHOOL_PRESENTATION_GUIDE.pdf');
  console.log(`Rendering ${regularHtmlPath} -> ${regularPdfPath}...`);
  await page.goto(pathToFileURL(regularHtmlPath).toString(), { waitUntil: 'networkidle' });
  await page.pdf({
    path: regularPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      bottom: '10mm',
      left: '12mm',
      right: '12mm'
    }
  });
  console.log('✅ Regular School Presentation Guide PDF generated successfully!');

  // 2. Play School Presentation Guide
  const playHtmlPath = resolve('c:/SchoolManagement/KRYPTON_PLAYSCHOOL_PRESENTATION_GUIDE.html');
  const playPdfPath = resolve('c:/SchoolManagement/KRYPTON_PLAYSCHOOL_PRESENTATION_GUIDE.pdf');
  console.log(`Rendering ${playHtmlPath} -> ${playPdfPath}...`);
  await page.goto(pathToFileURL(playHtmlPath).toString(), { waitUntil: 'networkidle' });
  await page.pdf({
    path: playPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '10mm',
      bottom: '10mm',
      left: '12mm',
      right: '12mm'
    }
  });
  console.log('✅ Play School Presentation Guide PDF generated successfully!');

  await browser.close();
}

generateGuides().catch(err => {
  console.error('Error generating presentation PDFs:', err);
  process.exit(1);
});
