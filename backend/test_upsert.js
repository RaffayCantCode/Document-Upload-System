const http = require('http');

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 5000, path, method };
    if (body) {
      opts.headers = { 'Content-Type': body.ct, 'Content-Length': Buffer.byteLength(body.data) };
    }
    const r = http.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
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
  const b = '----' + Date.now();
  const parts = [
    '--' + b + '\r\nContent-Disposition: form-data; name="applicant_id"\r\n\r\n' + id + '\r\n',
    '--' + b + '\r\nContent-Disposition: form-data; name="full_name"\r\n\r\n' + name + '\r\n',
    '--' + b + '\r\nContent-Disposition: form-data; name="document_type"\r\n\r\n' + type + '\r\n',
    '--' + b + '\r\nContent-Disposition: form-data; name="file"; filename="doc.' + ext + '"\r\nContent-Type: application/' + ext + '\r\n\r\n',
  ];
  return {
    ct: 'multipart/form-data; boundary=' + b,
    data: Buffer.concat([Buffer.from(parts.join('')), Buffer.from(content), Buffer.from('\r\n--' + b + '--\r\n')]),
  };
}

async function test() {
  // Upload transcript for APP-001
  let res = await req('POST', '/api/documents/upload', uploadBody('APP-001', 'John Smith', 'transcript', 'pdf', 'pdf content 1'));
  console.log('Upload 1:', res.status, res.body?.document?.id?.slice(0,8)+'...', res.body?.document?.document_type, 'name:', res.body?.document?.full_name);
  const firstId = res.body?.document?.id;

  // Upload transcript again — should UPSERT (same applicant + type)
  res = await req('POST', '/api/documents/upload', uploadBody('APP-001', 'John Smith', 'transcript', 'pdf', 'pdf content 2 UPDATED'));
  console.log('Upload 2 (same type):', res.status, res.body?.document?.id?.slice(0,8)+'...');
  const secondId = res.body?.document?.id;

  console.log(firstId === secondId ? '✓ UPSERT — IDs match, row was updated' : '✗ UPSERT FAILED — IDs differ');

  // Upload CNIC
  res = await req('POST', '/api/documents/upload', uploadBody('APP-001', 'John Smith', 'cnic', 'png', 'fake png'));
  console.log('Upload 3 (CNIC):', res.status, res.body?.document?.id?.slice(0,8)+'...');

  // List — should have 2 rows
  res = await req('GET', '/api/documents?applicant_id=APP-001');
  console.log('List:', res.body?.documents?.length, 'rows');
  res.body?.documents?.forEach(d => console.log(' -', d.document_type, '|', d.full_name));

  // Cleanup
  for (const d of res.body?.documents || []) {
    await req('DELETE', '/api/documents/' + d.id);
  }
  console.log('✓ Cleanup done, ALL PASSED');
}

test().catch(e => console.error('FAIL:', e.message));
