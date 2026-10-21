import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { verifySessionToken, extractToken } from '../../../lib/authSession';

const execPromise = util.promisify(exec);
const META_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'metadata.json');

function getGitInfo() {
  try {
    const branch = exec('git rev-parse --abbrev-ref HEAD', { timeout: 2000 })?.stdout?.trim() || 'main';
    return { branch };
  } catch (e) {
    return { branch: 'main' };
  }
}

export default async function handler(req, res) {
  // 1. GET: Retorna los metadatos actuales y estado de git
  if (req.method === 'GET') {
    try {
      let metadata = {};
      if (fs.existsSync(META_FILE_PATH)) {
        metadata = JSON.parse(fs.readFileSync(META_FILE_PATH, 'utf8'));
      }

      let currentBranch = 'main';
      let gitAvailable = true;
      let hasUncommitted = false;

      try {
        const { stdout: branchOut } = await execPromise('git rev-parse --abbrev-ref HEAD', { timeout: 3000 });
        currentBranch = branchOut.trim();

        const { stdout: statusOut } = await execPromise('git status --porcelain src/data/metadata.json public/assets/meta-image.*', { timeout: 3000 });
        hasUncommitted = statusOut.trim().length > 0;
      } catch (err) {
        gitAvailable = false;
      }

      return res.status(200).json({
        success: true,
        metadata,
        isDev: process.env.NODE_ENV !== 'production',
        git: {
          available: gitAvailable,
          branch: currentBranch,
          hasUncommitted,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al leer la metadata del sistema',
        error: error.message,
      });
    }
  }

  // 2. POST: Guardar cambios, regenerar fotos y/o push a GitHub
  if (req.method === 'POST') {
    // Protección de seguridad por Token de Sesión de Propietario
    const token = extractToken(req);
    const session = verifySessionToken(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Se requiere sesión activa de propietario.',
      });
    }

    const {
      metadata: newMetadata,
      regenerateImages = false,
      gitAction = 'none', // 'none' | 'commit' | 'push'
      commitMessage = 'chore(seo): update meta tags and social covers',
    } = req.body;

    if (!newMetadata || typeof newMetadata !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'El payload de metadata es inválido.',
      });
    }

    const results = {
      fileSaved: false,
      imagesRegenerated: false,
      gitActionExecuted: gitAction,
      gitOutput: null,
      gitError: null,
    };

    try {
      // Paso A: Guardar en el File System (src/data/metadata.json)
      const dataDir = path.dirname(META_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(META_FILE_PATH, JSON.stringify(newMetadata, null, 2) + '\n', 'utf8');
      results.fileSaved = true;

      // Paso B: Regenerar screenshots del Hero si se solicitó
      if (regenerateImages) {
        try {
          const scriptPath = path.join(process.cwd(), 'scripts', 'generate-meta-images.js');
          if (fs.existsSync(scriptPath)) {
            const { stdout } = await execPromise(`node "${scriptPath}"`, {
              timeout: 60000,
              cwd: process.cwd(),
            });
            results.imagesRegenerated = true;
            results.imageOutput = stdout;
          }
        } catch (imgErr) {
          results.imagesRegenerated = false;
          results.imageError = imgErr.message;
        }
      }

      // Paso C: Acciones de Git (Commit / Push)
      if (gitAction === 'commit' || gitAction === 'push') {
        try {
          // Agregar archivos relevantes
          await execPromise('git add src/data/metadata.json public/assets/meta-image.jpg public/assets/meta-image.png', {
            cwd: process.cwd(),
            timeout: 10000,
          });

          // Verificar si hay algo para comitear
          const { stdout: diffStatus } = await execPromise('git status --porcelain src/data/metadata.json public/assets/meta-image.*', {
            cwd: process.cwd(),
            timeout: 5000,
          });

          const sanitizedMsg = commitMessage.replace(/"/g, '\\"');

          if (diffStatus.trim().length > 0) {
            const { stdout: commitOut } = await execPromise(`git commit -m "${sanitizedMsg}"`, {
              cwd: process.cwd(),
              timeout: 10000,
            });
            results.gitCommitOutput = commitOut;
          } else {
            results.gitCommitOutput = 'No hubo cambios pendientes por commitear.';
          }

          // Si se solicitó push a GitHub
          if (gitAction === 'push') {
            const { stdout: branchOut } = await execPromise('git rev-parse --abbrev-ref HEAD', {
              cwd: process.cwd(),
              timeout: 5000,
            });
            const branch = branchOut.trim() || 'main';

            const { stdout: pushOut, stderr: pushErr } = await execPromise(`git push origin ${branch}`, {
              cwd: process.cwd(),
              timeout: 25000,
            });

            results.gitPushOutput = pushOut || pushErr || 'Push completado exitosamente a origin/' + branch;
            results.pushed = true;
          }
        } catch (gitErr) {
          results.gitError = gitErr.stderr || gitErr.stdout || gitErr.message;
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Metadatos guardados correctamente en el sistema de archivos.',
        metadata: newMetadata,
        results,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Error al procesar la solicitud de metadatos.',
        error: err.message,
        results,
      });
    }
  }

  return res.status(405).json({ success: false, message: 'Método no permitido' });
}
