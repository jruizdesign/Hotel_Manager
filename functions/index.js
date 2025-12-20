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
  
  if (!newDocument) {
    functions.logger.log('Document data is missing.');
    return null;
  }

  const { fileData, fileType, title } = newDocument;

  if (!fileData || typeof fileData !== 'string') {
    functions.logger.log('Document does not contain fileData or it is not a string.');
    return null;
  }
  
  if (!fileType || !fileType.startsWith('image/')) {
    functions.logger.log(`File type ${fileType} is not an image, skipping processing.`);
    return null;
  }

  const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
      functions.logger.error('Invalid fileData format. Expected base64 data URI.');
      return null;
  }
  const buffer = Buffer.from(matches[2], 'base64');
  
  const bucket = admin.storage().bucket();
  const tempFileName = `${documentId}_${title || 'document'}`;
  const tempFilePath = `temp-uploads/${tempFileName}`;
  const file = bucket.file(tempFilePath);
  
  await file.save(buffer, {
      metadata: { contentType: fileType },
  });
  functions.logger.log(`Temporarily saved to ${tempFilePath}`);
  
  const gcsUri = `gs://${bucket.name}/${tempFilePath}`;
  let destinationFolder = 'others';
  try {
    const [result] = await visionClient.textDetection(gcsUri);
    const detections = result.textAnnotations;
    if (detections && detections.length > 0) {
        const text = detections.map(d => d.description).join(' ').toLowerCase();

        if (text.includes('invoice')) {
          destinationFolder = 'invoices';
        } else if (text.includes('receipt')) {
          destinationFolder = 'receipts';
        } else if (text.includes('id') || text.includes('driver license')) {
          destinationFolder = 'ids';
        }
    }
    functions.logger.log(`Classification result: ${destinationFolder}`);

  } catch (error) {
    functions.logger.error('Error processing image with Vision API:', error);
  }

  const destinationPath = `${destinationFolder}/${tempFileName}`;
  await file.move(destinationPath);
  functions.logger.log(`File moved to ${destinationPath}`);
  
  const finalFile = bucket.file(destinationPath);
  const [url] = await finalFile.getSignedUrl({
    action: 'read',
    expires: '03-09-2491'
  });

  await snap.ref.update({
    storagePath: destinationPath,
    fileUrl: url,
    category: destinationFolder,
    fileData: admin.firestore.FieldValue.delete()
  });
  
  functions.logger.log(`Firestore document ${documentId} updated.`);
  
  return null;
});
