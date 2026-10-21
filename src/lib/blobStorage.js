import { put, get, del, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const LOCAL_BLOB_DIR = path.join(process.cwd(), '.local_blobs');

/**
 * Guarda un archivo o texto en Vercel Blob con soporte de acceso privado/público.
 * Si no hay BLOB_READ_WRITE_TOKEN en local, utiliza un fallback seguro al sistema de archivos local.
 *
 * @param {string} pathname - Ruta del archivo (ej. 'articles/blob.txt')
 * @param {string|Buffer|Blob} content - Contenido del archivo
 * @param {object} options - Opciones de guardado
 * @param {'private'|'public'} options.access - Nivel de acceso ('private' o 'public')
 * @param {boolean} options.addRandomSuffix - Si añade sufijo aleatorio para evitar sobreescritura (default: false)
 * @returns {Promise<object>} Metadatos del blob guardado
 */
export async function saveBlob(pathname, content, options = {}) {
  const {
    access = 'private',
    addRandomSuffix = false,
    contentType = typeof content === 'string' ? 'text/plain; charset=utf-8' : undefined,
  } = options;

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  // 1. Si el token de Vercel Blob está configurado en producción o local (.env)
  if (token) {
    const blob = await put(pathname, content, {
      access,
      addRandomSuffix,
      contentType,
      token,
    });

    return {
      success: true,
      provider: 'vercel-blob',
      url: blob.url,
      downloadUrl: blob.downloadUrl || blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      access,
    };
  }

  // 2. Modo Desarrollo Local Fallback (cuando aún no se ha creado el Store en Vercel)
  try {
    const targetPath = path.join(LOCAL_BLOB_DIR, pathname);
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(targetPath, content, 'utf8');

    return {
      success: true,
      provider: 'local-fallback',
      url: `/api/admin/blob?file=${encodeURIComponent(pathname)}`,
      downloadUrl: `/api/admin/blob?file=${encodeURIComponent(pathname)}`,
      pathname,
      access,
      note: 'Guardado localmente. Configura BLOB_READ_WRITE_TOKEN en .env para sincronizar con la nube de Vercel Blob.',
    };
  } catch (err) {
    throw new Error(`Error en almacenamiento local fallback: ${err.message}`);
  }
}

/**
 * Lee el contenido de un blob privado o público
 *
 * @param {string} urlOrPathname - URL o ruta del blob
 * @param {object} options - Opciones de lectura
 * @returns {Promise<string>} Contenido del blob
 */
export async function readBlob(urlOrPathname, options = {}) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  // Si es Vercel Blob en la nube
  if (token && urlOrPathname.startsWith('http')) {
    const blobResponse = await get(urlOrPathname, {
      access: options.access || 'private',
      token,
    });

    if (blobResponse && blobResponse.statusCode === 200) {
      return await blobResponse.text();
    }
  }

  // Fallback local
  const localPath = path.join(LOCAL_BLOB_DIR, urlOrPathname);
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, 'utf8');
  }

  throw new Error(`Blob no encontrado: ${urlOrPathname}`);
}

/**
 * Lista los blobs disponibles
 */
export async function listBlobs(options = {}) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    return await list({ token, ...options });
  }

  // Fallback local
  if (!fs.existsSync(LOCAL_BLOB_DIR)) return { blobs: [] };

  const files = [];
  function scan(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const rel = prefix ? `${prefix}/${item}` : item;
      if (fs.statSync(full).isDirectory()) {
        scan(full, rel);
      } else {
        files.push({ pathname: rel, size: fs.statSync(full).size });
      }
    }
  }
  scan(LOCAL_BLOB_DIR);

  return {
    blobs: files.map((f) => ({
      pathname: f.pathname,
      size: f.size,
      uploadedAt: new Date().toISOString(),
    })),
  };
}
