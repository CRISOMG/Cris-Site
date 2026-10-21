import { put } from '@vercel/blob';
import { saveBlob, readBlob, listBlobs } from '../../../lib/blobStorage';
import { verifySessionToken, extractToken } from '../../../lib/authSession';

export default async function handler(req, res) {
  // Validación de seguridad para propietarios
  const token = extractToken(req);
  const session = verifySessionToken(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Se requiere sesión de propietario.',
    });
  }

  // 1. POST: Subir o guardar un blob (ej. articles/blob.txt con Hello World!)
  if (req.method === 'POST') {
    try {
      const {
        pathname = 'articles/blob.txt',
        content = 'Hello World!',
        access = 'private', // 'private' | 'public'
        addRandomSuffix = false,
      } = req.body || {};

      // Si el usuario pasó explícitamente directPut: true y hay token, se puede usar directamente put()
      const result = await saveBlob(pathname, content, {
        access,
        addRandomSuffix,
      });

      return res.status(200).json({
        success: true,
        message: 'Blob procesado exitosamente.',
        blob: result,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Error al subir el blob',
        error: err.message,
      });
    }
  }

  // 2. GET: Leer o listar blobs
  if (req.method === 'GET') {
    try {
      const { file } = req.query;

      if (file) {
        const content = await readBlob(file, { access: 'private' });
        return res.status(200).send(content);
      }

      const listResult = await listBlobs();
      return res.status(200).json({
        success: true,
        ...listResult,
        cloudActive: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Error al leer los blobs',
        error: err.message,
      });
    }
  }

  return res.status(405).json({ message: 'Método no permitido' });
}
