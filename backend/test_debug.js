const http = require('http');
const id = 'DEBUG-' + Date.now();
const b = '----' + Date.now();
const header =
  '--' + b + '\r\nContent-Disposition: form-data; name="applicant_id"\r\n\r\n' + id + '\r\n' +
  '--' + b + '\r\nContent-Disposition: form-data; name="full_name"\r\n\r\nBob\r\n' +
  '--' + b + '\r\nContent-Disposition: form-data; name="document_type"\r\n\r\ncnic\r\n' +
  '--' + b + '\r\nContent-Disposition: form-data; name="file"; filename="id.png"\r\nContent-Type: image/png\r\n\r\n';
const data = Buffer.concat([Buffer.from(header), Buffer.from('cnic-data'), Buffer.from('\r\n--' + b + '--\r\n')]);

const opts = {
  hostname: 'localhost', port: 5000,
  path: '/api/documents/upload',
  method: 'POST',
  headers: { 'Content-Type': 'multipart/form-data; boundary=' + b, 'Content-Length': data.length },
};
const r = http.request(opts, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log(res.statusCode, d));
});
r.on('error', e => console.log('ERR:', e.message));
r.write(data);
r.end();
