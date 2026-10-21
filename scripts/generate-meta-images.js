/**
 * scripts/generate-meta-images.js
 * 
 * Script automatizado para capturar screenshots de alta fidelidad del Hero del Home
 * y generar automáticamente los metadatos visuales de Open Graph y Twitter Cards:
 *   - public/assets/meta-image.jpg (1200 x 628 - Landscape / Twitter Card / Facebook)
 *   - public/assets/meta-image.png (600 x 600 - Square / WhatsApp / Avatar)
 *
 * Utiliza puppeteer-core conectándose a Google Chrome o Microsoft Edge local.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');

// Rutas comunes de navegadores Chromium en Windows, macOS y Linux
function findBrowserExecutable() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const candidates = [
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`,
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

// Comprueba si un puerto HTTP está respondiendo
function checkServer(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Espera a que el servidor esté listo
async function waitForServer(port, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    const isUp = await checkServer(port);
    if (isUp) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  console.log('\n🎨 ================================================');
  console.log('   GENERADOR AUTOMATIZADO DE META IMÁGENES');
  console.log('   Cris-Site: Hero Screenshots (OG & Twitter Cards)');
  console.log('================================================\n');

  const executablePath = findBrowserExecutable();
  if (!executablePath) {
    console.error('❌ Error: No se encontró Google Chrome o Microsoft Edge instalado.');
    console.error('   Por favor define la variable CHROME_PATH con la ruta de tu navegador.');
    process.exit(1);
  }
  console.log(`🔍 Navegador detectado: ${path.basename(executablePath)}`);

  // Detectar o levantar servidor local
  let targetPort = 3000;
  let devServerProcess = null;
  const isPort3000Active = await checkServer(3000);

  if (isPort3000Active) {
    console.log('⚡ Servidor Next.js detectado activo en http://localhost:3000');
    targetPort = 3000;
  } else {
    targetPort = 3099;
    console.log(`🚀 Iniciando servidor temporal en http://localhost:${targetPort}...`);
    devServerProcess = spawn('npx', ['next', 'dev', '-p', String(targetPort)], {
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: path.resolve(__dirname, '..'),
    });

    devServerProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('Ready in') || msg.includes('started server')) {
        process.stdout.write(`   ✓ Next.js listo\n`);
      }
    });

    const ready = await waitForServer(targetPort);
    if (!ready) {
      console.error('❌ Error: No se pudo iniciar el servidor Next.js a tiempo.');
      if (devServerProcess) devServerProcess.kill();
      process.exit(1);
    }
  }

  // Directorio temporal aislado para el perfil de Chrome (evita bloqueos de sesión abierta)
  const tempProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cris-meta-chrome-'));

  let browser;
  try {
    console.log('🌐 Abriendo navegador headless...');
    browser = await puppeteer.launch({
      executablePath,
      headless: 'new',
      userDataDir: tempProfileDir,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--hide-scrollbars',
        '--mute-audio',
      ],
    });

    const page = await browser.newPage();

    const outputDir = path.resolve(__dirname, '../public/assets');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const targetUrl = `http://localhost:${targetPort}/`;
    console.log(`📄 Cargando página de inicio: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Esperar a que las fuentes (Grand Hotel, Nova Round, Fredoka) y las fotos carguen completamente
    console.log('⏳ Esperando carga completa de fuentes tipográficas e imágenes...');
    await page.evaluate(async () => {
      if (document.fonts) {
        await document.fonts.ready;
      }
      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    // Pequeño retardo para asegurar que los estilos de Tailwind y fuentes terminen de pintar
    await new Promise((r) => setTimeout(r, 600));

    // Preparar el DOM para el screenshot limpio del Hero:
    // Ocultar iconos sociales, auth floating badge y enlaces de navegación interna si existieran
    await page.evaluate(() => {
      // Ocultar SocialIcons
      const socialContainer = document.querySelector('div.max-w-sm');
      if (socialContainer) socialContainer.style.setProperty('display', 'none', 'important');

      // Ocultar FloatingAuthBadge si estuviera presente
      const asideBadge = document.querySelector('aside');
      if (asideBadge) asideBadge.style.setProperty('display', 'none', 'important');

      // Eliminar márgenes y barras de desplazamiento
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    });

    // ==========================================
    // 1. CAPTURA: meta-image.jpg (Landscape 1200 x 628)
    // ==========================================
    const jpgPath = path.join(outputDir, 'meta-image.jpg');
    console.log('\n📸 Capturando Landscape Open Graph / Twitter Card (1200 x 628)...');
    await page.setViewport({
      width: 1200,
      height: 628,
      deviceScaleFactor: 1,
    });
    // Forzar re-centrado vertical
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        main.style.minHeight = '628px';
        main.style.height = '628px';
        main.style.padding = '0';
        main.style.display = 'flex';
        main.style.flexDirection = 'column';
        main.style.justifyContent = 'center';
        main.style.alignItems = 'center';
      }
      const bg = document.querySelector('.bg-page');
      if (bg) {
        bg.style.minHeight = '628px';
        bg.style.height = '628px';
      }
    });

    await page.screenshot({
      path: jpgPath,
      type: 'jpeg',
      quality: 92,
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 628,
      },
    });
    console.log(`   ✓ Guardado con éxito: public/assets/meta-image.jpg (${(fs.statSync(jpgPath).size / 1024).toFixed(1)} KB)`);

    // ==========================================
    // 2. CAPTURA: meta-image.png (Square 600 x 600)
    // ==========================================
    const pngPath = path.join(outputDir, 'meta-image.png');
    console.log('📸 Capturando Square / WhatsApp Preview (600 x 600)...');
    await page.setViewport({
      width: 600,
      height: 600,
      deviceScaleFactor: 1,
    });
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        main.style.minHeight = '600px';
        main.style.height = '600px';
        main.style.padding = '12px';
      }
      const bg = document.querySelector('.bg-page');
      if (bg) {
        bg.style.minHeight = '600px';
        bg.style.height = '600px';
      }
      // Ajuste proporcional fino para que en 600x600 el texto respire armoniosamente
      const photo = document.querySelector('img[src*="cris-photo"]');
      if (photo) {
        photo.style.width = '175px';
        photo.style.height = '175px';
      }
    });

    await page.screenshot({
      path: pngPath,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 600,
        height: 600,
      },
    });
    console.log(`   ✓ Guardado con éxito: public/assets/meta-image.png (${(fs.statSync(pngPath).size / 1024).toFixed(1)} KB)`);

    console.log('\n✨ ¡Imágenes de metadata generadas y actualizadas satisfactoriamente!');
  } finally {
    if (browser) {
      await browser.close();
    }
    // Limpiar directorio temporal del perfil de Chrome
    try {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    } catch (_) {}

    // Detener servidor temporal si nosotros lo iniciamos
    if (devServerProcess) {
      console.log('🛑 Cerrando servidor temporal Next.js...');
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(devServerProcess.pid), '/f', '/t']);
        } else {
          devServerProcess.kill('SIGTERM');
        }
      } catch (_) {}
    }
  }
}

main().catch((err) => {
  console.error('\n❌ Ocurrió un error inesperado al generar las imágenes:', err);
  process.exit(1);
});
