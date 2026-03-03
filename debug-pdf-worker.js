const path = require('path');

try {
  const { PDFParse } = require('pdf-parse');
  console.log('Successfully required pdf-parse');
  
  // Set worker path
  try {
    const workerPath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
    console.log('Worker path:', workerPath);
    PDFParse.setWorker(workerPath);
  } catch (e) {
    console.warn('Failed to resolve worker path:', e.message);
  }

  // Try to parse a dummy PDF
  const pdfData = Buffer.from('%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF');
  
  const instance = new PDFParse({ data: pdfData });
  instance.getText().then(data => {
    console.log('Text extraction successful:', data.text);
  }).catch(e => {
    console.error('Extraction failed:', e);
  });
  
} catch (e) {
  console.error('Require failed:', e);
}
