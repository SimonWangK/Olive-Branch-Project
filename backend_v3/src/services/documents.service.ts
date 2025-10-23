import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { storage } from '@/utils/firebase';
import { db } from '@/utils/firebase'; 
const prisma = new PrismaClient();


const uploadFileSchema = z.object({
  caseId: z.number(),
  title: z.string().min(1),
});

// 
export async function uploadDocument(file: Express.Multer.File, data: unknown) {
  const parsed = uploadFileSchema.parse(data);


  const base64Data = file.buffer.toString('base64');
  const mimeType = file.mimetype;

  // 
  const fileDoc = await addDoc(collection(db, 'files'), {
    caseId: parsed.caseId,
    fileName: file.originalname,
    mimeType: mimeType,
    data: base64Data,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  });

  // 
  const fileUrl = `firestore://files/${fileDoc.id}`;

  // 
  const document = await prisma.document.create({
    data: {
      case_id: parsed.caseId,
      title: parsed.title,
    },
  });

  // 
  const version = await prisma.documentVersion.create({
    data: {
      document_id: document.id,
      version_no: 1,
      url: fileUrl,
    },
  });

  return { document, version, fileId: fileDoc.id };
}

// 
export async function getFileContent(fileId: string) {
  const { getDoc, doc } = await import('firebase/firestore');
  const fileDoc = await getDoc(doc(db, 'files', fileId));
  
  if (!fileDoc.exists()) {
    throw new Error('file not exist');
  }

  const data = fileDoc.data();
  return {
    fileName: data.fileName,
    mimeType: data.mimeType,
    data: data.data, //
  };
}

export const createDocumentSchema = z.object({
  title: z.string().min(1),
});
export async function createDocument(caseId: number, data: unknown) {
  const parsed = createDocumentSchema.parse(data);
  return prisma.document.create({
    data: { ...parsed, case_id: caseId },
  });
}

export const createVersionSchema = z.object({
  url: z.string().url(),
});
export async function createDocumentVersion(documentId: number, data: unknown) {
  const parsed = createVersionSchema.parse(data);


  const maxVersion = await prisma.documentVersion.aggregate({
    where: { document_id: documentId },
    _max: { version_no: true },
  });

  const versionNo = (maxVersion._max.version_no ?? 0) + 1;

  return prisma.documentVersion.create({
    data: {
      document_id: documentId,
      version_no: versionNo,
      url: parsed.url,
    },
  });
}


export async function approveDocumentVersion(versionId: number, userId: number) {
  const version = await prisma.documentVersion.findUnique({ where: { id: versionId } });
  if (!version) {
    throw { code: 'VERSION_NOT_FOUND', message: 'Document version not found' };
  }

  return prisma.documentVersion.update({
    where: { id: versionId },
    data: {
      approved_by: userId,
      approved_at: new Date(),
    },
  });
}


export async function getDocuments(caseId: number) {
  return prisma.document.findMany({
    where: { case_id: caseId },
    include: { versions: { orderBy: { version_no: 'desc' } } },
  });
}
