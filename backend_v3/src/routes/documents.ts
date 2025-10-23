import { Router } from 'express';
import { auth } from '@/middleware/auth';
import { validate } from '@/middleware/validator';
import {
  createDocument,
  createDocumentVersion,
  approveDocumentVersion,
  getDocuments,
  uploadDocument,
  getFileContent
} from '@/services/documents.service';

import multer from 'multer';


const upload = multer({ storage: multer.memoryStorage() });

const router = Router({ mergeParams: true });

// 
router.get('/', auth(['staff', 'admin','viewer']), async (req, res) => {
  const caseId = Number(req.params.id);
  const docs = await getDocuments(caseId);
  res.json(docs);
});

// 
router.post('/', auth(['staff', 'admin']), async (req, res) => {
  const caseId = Number(req.params.id);
  const doc = await createDocument(caseId, req.body);
  res.status(201).json(doc);
});

// 
router.post('/:documentId/versions', auth(['staff', 'admin']), async (req, res) => {
  const documentId = Number(req.params.documentId);
  const version = await createDocumentVersion(documentId, req.body);
  res.status(201).json(version);
});

// 
router.post('/versions/:versionId/approve', auth(['admin']), async (req, res) => {
  const versionId = Number(req.params.versionId);
  const userId = (req as any).user.id;
  const approved = await approveDocumentVersion(versionId, userId);
  res.json(approved);
});




router.post('/upload', auth(['staff', 'admin']), upload.single('file'), async (req, res) => {
  try {
    const caseId = Number(req.params.id);
    const { title } = req.body;
    const file = req.file; // 现在 TypeScript 能识别 req.file

    if (!file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const result = await uploadDocument(file, { caseId, title });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || '文件上传失败' });
  }
});


router.get('/file/:fileId', auth(['staff', 'admin','viewer']), async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await getFileContent(fileId);
    
    // 转换 Base64 回 Buffer
    const buffer = Buffer.from(file.data, 'base64');
    
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
    res.send(buffer);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});
export default router;
