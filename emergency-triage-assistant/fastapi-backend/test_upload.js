import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testUpload() {
  const form = new FormData();
  // Create a minimal valid PDF-like file just to test upload 
  const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n173\n%%EOF');
  
  fs.writeFileSync('dummy.pdf', dummyPdf);
  form.append('patient_id', 'test_patient');
  form.append('file', fs.createReadStream('dummy.pdf'));

  try {
    const response = await fetch('http://localhost:8000/upload_pdf', {
      method: 'POST',
      body: form
    });
    const result = await response.json();
    console.log("Success:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

testUpload();
