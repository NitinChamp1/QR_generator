const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'public', 'samples');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Write sample SVGs that can also be used as test images
const svg1 = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <rect x="20" y="20" width="560" height="360" fill="none" stroke="#111111" stroke-width="3"/>
  <rect x="20" y="20" width="560" height="45" fill="#ff5500"/>
  <text x="40" y="50" font-family="monospace" font-size="20" font-weight="bold" fill="#ffffff">SAMPLE VOUCHER #01 // NOVASCALE</text>
  <text x="40" y="110" font-family="sans-serif" font-size="24" font-weight="900" fill="#111111">Cloud Infrastructure Services</text>
  <text x="40" y="145" font-family="monospace" font-size="14" fill="#666666">ISSUED: 2026-11-07 | ACCOUNT: NS-88219</text>
  <line x1="40" y1="170" x2="560" y2="170" stroke="#111111" stroke-width="2"/>
  <text x="40" y="210" font-family="monospace" font-size="16" fill="#111111">Service Tier: Dedicated Edge Node Cluster</text>
  <text x="40" y="245" font-family="monospace" font-size="16" fill="#111111">Bandwidth: 10 Gbps Unmetered Pipe</text>
  <text x="40" y="280" font-family="monospace" font-size="16" fill="#111111">Encryption: Hardware Enclave Validated</text>
  <line x1="40" y1="310" x2="560" y2="310" stroke="#111111" stroke-width="2"/>
  <text x="40" y="350" font-family="monospace" font-size="22" font-weight="bold" fill="#ff5500">BILLED AMOUNT: $ 120.00 USD</text>
</svg>`;

const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="100%" height="100%" fill="#f5f4f0"/>
  <rect x="20" y="20" width="560" height="360" fill="none" stroke="#111111" stroke-width="3"/>
  <rect x="20" y="20" width="560" height="45" fill="#111111"/>
  <text x="40" y="50" font-family="monospace" font-size="20" font-weight="bold" fill="#ff5500">SAMPLE MANIFEST #02 // LOGISTICS</text>
  <text x="40" y="110" font-family="sans-serif" font-size="24" font-weight="900" fill="#111111">Hardware Dispatch Package</text>
  <text x="40" y="145" font-family="monospace" font-size="14" fill="#666666">WAYBILL: WB-99142-USA | AIR CARGO</text>
  <line x1="40" y1="170" x2="560" y2="170" stroke="#111111" stroke-width="2"/>
  <text x="40" y="210" font-family="monospace" font-size="16" fill="#111111">Consignee: NovaScale Distribution Center</text>
  <text x="40" y="245" font-family="monospace" font-size="16" fill="#111111">Package Contents: 4x Neural Accelerator Units</text>
  <text x="40" y="280" font-family="monospace" font-size="16" fill="#111111">Handling: Temperature & Shock Monitored</text>
  <line x1="40" y1="310" x2="560" y2="310" stroke="#111111" stroke-width="2"/>
  <text x="40" y="350" font-family="monospace" font-size="22" font-weight="bold" fill="#111111">STATUS: CLEARED FOR DELIVERY</text>
</svg>`;

const svg3 = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <rect x="20" y="20" width="560" height="360" fill="none" stroke="#111111" stroke-width="3"/>
  <rect x="20" y="20" width="560" height="45" fill="#ff5500"/>
  <text x="40" y="50" font-family="monospace" font-size="20" font-weight="bold" fill="#ffffff">CERTIFICATE #03 // VERIFICATION</text>
  <text x="40" y="110" font-family="sans-serif" font-size="24" font-weight="900" fill="#111111">ISO/IEC 18004 Compliance Audit</text>
  <text x="40" y="145" font-family="monospace" font-size="14" fill="#666666">AUDIT REF: ISO-QR-2026-PASS</text>
  <line x1="40" y1="170" x2="560" y2="170" stroke="#111111" stroke-width="2"/>
  <text x="40" y="210" font-family="monospace" font-size="16" fill="#111111">Matrix Standard: ISO/IEC 18004:2015</text>
  <text x="40" y="245" font-family="monospace" font-size="16" fill="#111111">Error Correction Tolerance: Level H (30%)</text>
  <text x="40" y="280" font-family="monospace" font-size="16" fill="#111111">Readability: 100% Optical Pass Rate</text>
  <line x1="40" y1="310" x2="560" y2="310" stroke="#111111" stroke-width="2"/>
  <text x="40" y="350" font-family="monospace" font-size="22" font-weight="bold" fill="#ff5500">ASSESSMENT: VERIFIED COMPLIANT</text>
</svg>`;

fs.writeFileSync(path.join(outDir, 'sample-page-1.svg'), svg1);
fs.writeFileSync(path.join(outDir, 'sample-page-2.svg'), svg2);
fs.writeFileSync(path.join(outDir, 'sample-page-3.svg'), svg3);
console.log('Sample vector assets generated in public/samples/');
