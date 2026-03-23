const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Finds the local IPv4 address
 */
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const currentIp = getLocalIp();
console.log(`📡 Detected Local IP: ${currentIp}`);

// 1. Update Frontend api.ts
const apiPath = path.join(__dirname, '..', 'src', 'services', 'api.ts');
if (fs.existsSync(apiPath)) {
  let content = fs.readFileSync(apiPath, 'utf8');
  // Regex to find: // Using current machine IP: XXX.XXX.XXX.XXX
  const ipCommentRegex = /(\/\/ Using current machine IP: )(\d+\.\d+\.\d+\.\d+|localhost)/g;
  const urlRegex = /(return 'http:\/\/)((\d+\.\d+\.\d+\.\d+|localhost):5000\/api')/g;

  content = content.replace(ipCommentRegex, `$1${currentIp}`);
  content = content.replace(urlRegex, `$1${currentIp}:5000/api'`);

  fs.writeFileSync(apiPath, content);
  console.log(`✅ Updated frontend/src/services/api.ts with ${currentIp}`);
}

// 2. Update Backend .env
const envPath = path.join(__dirname, '..', '..', 'Backend', '.env');
if (fs.existsSync(envPath)) {
  let content = fs.readFileSync(envPath, 'utf8');
  const backendUrlRegex = /(BACKEND_URL=http:\/\/)((\d+\.\d+\.\d+\.\d+|localhost):5000)/g;
  
  if (backendUrlRegex.test(content)) {
    content = content.replace(backendUrlRegex, `$1${currentIp}:5000`);
    fs.writeFileSync(envPath, content);
    console.log(`✅ Updated Backend/.env with ${currentIp}`);
  }
}
