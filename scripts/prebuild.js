import fs from 'node:fs';

try {
  if (!fs.existsSync('./firebase-applet-config.json')) {
    fs.writeFileSync('./firebase-applet-config.json', '{}');
    console.log('firebase-applet-config.json created successfully (empty fallback).');
  }
} catch (error) {
  console.error('Failed to write firebase-applet-config.json:', error);
}

// Automatically download custom Google Drive logo to public/app_icon.png during build
async function downloadLogoOnPrebuild() {
  const fileId = '1T378zkUiwNTSniqvuW6fgUiitJobHajU';
  const url = `https://docs.google.com/uc?export=download&id=${fileId}`;
  
  console.log(`[Prebuild] Downloading logo from Google Drive to local assets...`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Drive logo: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const text = await response.text();
      const confirmMatch = text.match(/confirm=([a-zA-Z0-9_]+)/);
      if (confirmMatch) {
        const confirmToken = confirmMatch[1];
        const confirmUrl = `https://docs.google.com/uc?export=download&id=${fileId}&confirm=${confirmToken}`;
        const confirmResp = await fetch(confirmUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (confirmResp.ok) {
          const buffer = await confirmResp.arrayBuffer();
          fs.writeFileSync('./public/app_icon.png', Buffer.from(buffer));
          console.log('[Prebuild] Logo downloaded and saved to ./public/app_icon.png via confirmation token!');
          return;
        }
      }
      
      const altUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const altResp = await fetch(altUrl);
      if (altResp.ok) {
        const buffer = await altResp.arrayBuffer();
        fs.writeFileSync('./public/app_icon.png', Buffer.from(buffer));
        console.log('[Prebuild] Logo downloaded and saved to ./public/app_icon.png via alternative uc!');
        return;
      }
      throw new Error('Could not download image. Received HTML prompt or authentication limit page instead.');
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync('./public/app_icon.png', Buffer.from(buffer));
    console.log('[Prebuild] Logo downloaded successfully and saved locally to ./public/app_icon.png');
  } catch (error) {
    console.warn('[Prebuild Warning] Custom logo download failed, using existing fallback:', error.message);
  }
}

// Execute download
downloadLogoOnPrebuild();
