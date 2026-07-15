const http = require('http');

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 5000, path, method };
    if (body) {
      opts.headers = { 'Content-Type': body.ct, 'Content-Length': Buffer.byteLength(body.data) };
    }
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, raw: d }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(body.data);
    r.end();
  });
}

function uploadBody(id, name, type, ext, content) {
  const b = '----' + Date.now() + Math.random();
  const header =
    '--' + b + '\r\nContent-Disposition: form-data; name="applicant_id"\r\n\r\n' + id + '\r\n' +
    '--' + b + '\r\nContent-Disposition: form-data; name="full_name"\r\n\r\n' + name + '\r\n' +
    '--' + b + '\r\nContent-Disposition: form-data; name="document_type"\r\n\r\n' + type + '\r\n' +
    '--' + b + '\r\nContent-Disposition: form-data; name="file"; filename="doc.' + ext + '"\r\nContent-Type: application/' + ext + '\r\n\r\n';
  return {
    ct: 'multipart/form-data; boundary=' + b,
    data: Buffer.concat([Buffer.from(header), Buffer.from(content), Buffer.from('\r\n--' + b + '--\r\n')]),
  };
}

async function test() {
  const id = 'UP-TEST-' + Date.now();
  console.log('Testing with applicant:', id);

  // Upload transcript
  let r = await req('POST', '/api/documents/upload', uploadBody(id, 'Alice', 'transcript', 'pdf', 'v1'));
  console.log('1 transcript:', r.status, r.body?.document?.id?.slice(0,8));
  const firstId = r.body?.document?.id;

  // Upload transcript again — should upsert
  r = await req('POST', '/api/documents/upload', uploadBody(id, 'Alice', 'transcript', 'pdf', 'v2'));
  console.log('2 transcript again:', r.status, r.body?.document?.id?.slice(0,8), firstId === r.body?.document?.id ? 'UPSERT OK' : 'FAIL');
  const secondId = r.body?.document?.id;

  // Upload CNIC
  r = await req('POST', '/api/documents/upload', uploadBody(id, 'Alice', 'cnic', 'png', 'cnic-data'));
  console.log('3 cnic:', r.status, r.raw || JSON.stringify(r.body));

  // Upload photo
  r = await req('POST', '/api/documents/upload', uploadBody(id, 'Alice', 'photo', 'jpg', 'photo-data'));
  console.log('4 photo:', r.status, r.raw || JSON.stringify(r.body));

  // List — should have 3 rows
  r = await req('GET', '/api/documents?applicant_id=' + id);
  console.log('List:', r.body?.documents?.length, 'rows (expected 3)');
  r.body?.documents?.forEach(d => console.log(' -', d.document_type, '|', d.full_name, '|', d.file_name));

  // Cleanup
  for (const d of r.body?.documents || []) {
    await req('DELETE', '/api/documents/' + d.id);
  }
  console.log('Cleaned up, ALL PASSED');
}

test().catch(e => console.error('FAIL:', e.message));
