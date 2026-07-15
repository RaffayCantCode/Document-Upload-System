const http = require('http');

const b = '----' + Date.now();
const parts = [
  '--' + b + '\r\nContent-Disposition: form-data; name="applicant_id"\r\n\r\nTEST-CNIC\r\n',
  '--' + b + '\r\nContent-Disposition: form-data; name="full_name"\r\n\r\nJane Doe\r\n',
  '--' + b + '\r\nContent-Disposition: form-data; name="document_type"\r\n\r\ncnic\r\n',
  '--' + b + '\r\nContent-Disposition: form-data; name="file"; filename="id.png"\r\nContent-Type: image/png\r\n\r\n',
];
const body = Buffer.concat([Buffer.from(parts.join('')), Buffer.from('png data here'), Buffer.from('\r\n--' + b + '--\r\n')]);

const opts = {
  hostname: 'localhost', port: 5000,
  path: '/api/documents/upload',
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data; boundary=' + b, 'Content-Length': body.length },
};

const r = http.request(opts, (res) => {
  let d = ''; res.on('data', c => d += c); res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', d);
  });
});
r.on('error', e => console.log('ERR:', e.message));
r.write(body);
r.end();
