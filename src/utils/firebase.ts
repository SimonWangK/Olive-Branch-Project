// import { initializeApp, cert } from 'firebase-admin/app';
// import { getStorage } from 'firebase-admin/storage';
// import path from 'path';
// import { v4 as uuidv4 } from 'uuid';


// const serviceAccount = require(path.resolve(__dirname, '../../firebase-service-account.json'));

// initializeApp({
//   credential: cert(serviceAccount),
//   storageBucket: process.env.FIREBASE_BUCKET_URL,
// });

// const bucket = getStorage().bucket();


// export async function generatePresignedUrl(filename: string, contentType: string) {
//   const file = bucket.file(`${uuidv4()}_${filename}`);
//   const expiresAt = Date.now() + 15 * 60 * 1000; 

//   const [url] = await file.getSignedUrl({
//     action: 'write',
//     expires: expiresAt,
//     contentType,
//   });

//   return { url, path: file.name };
// }
