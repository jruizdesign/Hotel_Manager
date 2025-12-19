const functions = require('firebase-functions');
const admin = require('firebase-admin');
const vision = require('@google-cloud/vision');

admin.initializeApp();

const visionClient = new vision.ImageAnnotatorClient();

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
