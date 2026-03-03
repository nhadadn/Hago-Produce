try {
  const pdfParseNode = require('pdf-parse/node');
  console.log('Keys of pdfParseNode:', Object.keys(pdfParseNode));
  
  if (pdfParseNode.default) {
      console.log('Checking default export:', Object.keys(pdfParseNode.default));
      try {
          const instance = new pdfParseNode.default({ data: Buffer.from('%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF') });
          console.log('Created instance with default export');
      } catch (e) {
          console.log('Failed to create instance with default export:', e.message);
      }
  }

} catch (e) {
  console.error('Require failed:', e);
}
