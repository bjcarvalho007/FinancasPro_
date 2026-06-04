import fs from 'node:fs';

try {
  if (!fs.existsSync('./firebase-applet-config.json')) {
    fs.writeFileSync('./firebase-applet-config.json', '{}');
    console.log('firebase-applet-config.json created successfully (empty fallback).');
  }
} catch (error) {
  console.error('Failed to write firebase-applet-config.json:', error);
}
