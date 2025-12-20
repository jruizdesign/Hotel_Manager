const functions = require('firebase-functions');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');

admin.initializeApp();

const visionClient = new vision.ImageAnnotatorClient();

// This function is triggered when a file is uploaded to Firebase Storage.
exports.classifyImage = functions.storage.object().onFinalize(async (object) => {
  const fileBucket = object.bucket;
  const filePath = object.name;
  const contentType = object.contentType;

  // Exit if this is not an image.
  if (!contentType.startsWith('image/')) {
    return functions.logger.log('This is not an image.');
  }

  // Exit if the image is already in a classified folder
  if (filePath.startsWith('invoices/') || filePath.startsWith('receipts/') || filePath.startsWith('ids/')) {
    return functions.logger.log('Image is already classified.');
  }


  const bucket = admin.storage().bucket(fileBucket);
  const file = bucket.file(filePath);
  const gcsUri = `gs://${fileBucket}/${filePath}`;

  try {
    const [result] = await visionClient.textDetection(gcsUri);
    const detections = result.textAnnotations;
    const text = detections.map(d => d.description).join(' ').toLowerCase();

    let destinationFolder = 'others';

    if (text.includes('invoice')) {
      destinationFolder = 'invoices';
    } else if (text.includes('receipt')) {
      destinationFolder = 'receipts';
    } else if (text.includes('id') || text.includes('driver license')) {
      destinationFolder = 'ids';
    }
    
    const fileName = filePath.split('/').pop();
    const destination = `${destinationFolder}/${fileName}`;
    
    await file.move(destination);

    return functions.logger.log(`Image moved to ${destination}`);

  } catch (error) {
    return functions.logger.error('Error processing image:', error);
  }
});

// This new function is triggered when a document is created in Firestore.
exports.processDocument = functions.firestore.document('documents/{documentId}').onCreate(async (snap, context) => {
  const newDocument = snap.data();
  const documentId = context.params.documentId;
  
  if (!newDocument || !newDocument.fileData || typeof newDocument.fileData !== 'string') {
    functions.logger.log('Document data is missing or invalid.');
    return null;
  }

  const { fileData, fileType, title } = newDocument;
  const matches = fileData.match(/^data:(.+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    functions.logger.error('Invalid base64 data format.');
    return null;
  }

  const buffer = Buffer.from(matches[2], 'base64');
  const bucket = admin.storage().bucket();
  const fileName = `${documentId}_${title.replace(/\s/g, '_')}`;
  let destinationFolder = 'documents/others'; // Default folder

  // Use Vision API to classify the document
  try {
    const [result] = await visionClient.textDetection({ image: { content: buffer } });
    const text = result.fullTextAnnotation?.text.toLowerCase() || '';

    if (text.includes('invoice')) {
      destinationFolder = 'documents/invoices';
    } else if (text.includes('receipt')) {
      destinationFolder = 'documents/receipts';
    } else if (text.includes('id') || text.includes('license')) {
      destinationFolder = 'documents/ids';
    }
  } catch (error) {
    functions.logger.error('Vision API processing failed', error);
  }
  
  const filePath = `${destinationFolder}/${fileName}`;
  const file = bucket.file(filePath);

  await file.save(buffer, { metadata: { contentType: fileType } });
  const [url] = await file.getSignedUrl({ action: 'read', expires: '03-09-2491' });

  return snap.ref.update({
    storagePath: filePath,
    fileUrl: url,
    category: destinationFolder.split('/').pop(),
    fileData: admin.firestore.FieldValue.delete(), // Remove the base64 data
  });
});
