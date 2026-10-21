import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { verifySessionToken, extractToken } from '../../../lib/authSession';
import { getServiceSupabase } from '../../../lib/supabaseClient';

const execPromise = util.promisify(exec);
const SOCIAL_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'social.json');

export default async function handler(req, res) {
  const supabase = getServiceSupabase();

  // 1. GET: Retorna la matriz de features y enlaces sociales (Supabase en tiempo real o fallback a local)
  if (req.method === 'GET') {
    try {
      let socialData = null;

      // Intentar leer configuración en tiempo real desde Supabase
      if (supabase) {
        try {
          const { data: configRow } = await supabase
            .from('site_config')
            .select('data')
            .eq('key', 'social')
            .single();

          if (configRow?.data) {
            socialData = configRow.data;
          }
        } catch (_) {}
      }

      // Fallback al archivo local si Supabase no tiene datos
      if (!socialData && fs.existsSync(SOCIAL_FILE_PATH)) {
        socialData = JSON.parse(fs.readFileSync(SOCIAL_FILE_PATH, 'utf8'));
      }

      let currentBranch = 'main';
      try {
        const { stdout } = await execPromise('git rev-parse --abbrev-ref HEAD', { timeout: 3000 });
        currentBranch = stdout.trim();
      } catch (_) {}

      return res.status(200).json({
        success: true,
        data: socialData || {},
        branch: currentBranch,
        isDev: process.env.NODE_ENV !== 'production',
        cloudSync: Boolean(supabase),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error al leer la matriz de características',
        error: error.message,
      });
    }
  }

  // 2. POST: Guardar cambios en la matriz y opcionalmente Git Commit/Push
  if (req.method === 'POST') {
    const token = extractToken(req);
    const session = verifySessionToken(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Se requiere sesión activa de propietario.',
      });
    }

    const {
      socialConfig: newConfig,
      gitAction = 'none', // 'none' | 'commit' | 'push'
      commitMessage = 'chore(social): update link tree and feature flags matrix',
    } = req.body;

    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Payload inválido.',
      });
    }

    const results = {
      fileSaved: false,
      gitActionExecuted: gitAction,
      gitCommitOutput: null,
      gitPushOutput: null,
      gitError: null,
      pushed: false,
    };

    try {
      // Guardar en el file system
      const dir = path.dirname(SOCIAL_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(SOCIAL_FILE_PATH, JSON.stringify(newConfig, null, 2) + '\n', 'utf8');
      results.fileSaved = true;

      // Guardar también en la nube de Supabase (PostgreSQL en tiempo real)
      if (supabase) {
        try {
          await supabase.from('site_config').upsert({
            key: 'social',
            data: newConfig,
            updated_at: new Date().toISOString(),
          });
          results.supabaseSaved = true;
        } catch (supaErr) {
          results.supabaseError = supaErr.message;
        }
      }

      // Git Commit y/o Push
      if (gitAction === 'commit' || gitAction === 'push') {
        try {
          await execPromise('git add src/data/social.json', { cwd: process.cwd(), timeout: 10000 });

          const { stdout: diffStatus } = await execPromise('git status --porcelain src/data/social.json', {
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
            results.gitCommitOutput = 'Sin cambios pendientes.';
          }

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

            results.gitPushOutput = pushOut || pushErr || `Push completado a ${branch}`;
            results.pushed = true;
          }
        } catch (gitErr) {
          results.gitError = gitErr.stderr || gitErr.stdout || gitErr.message;
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Matriz de características guardada correctamente.',
        data: newConfig,
        results,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Error al procesar la matriz.',
        error: err.message,
      });
    }
  }

  return res.status(405).json({ success: false, message: 'Método no permitido' });
}
