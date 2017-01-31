const fs = require('fs');
const path = require('path');
const gs = require('@google-cloud/storage');

class GCloud {
  constructor({ projectId, keyFile }) {
    this.storage = gs({
      projectId,
      keyFilename: keyFile,
    });
  }

  uploadImage(localImagePath, metadata, bucketName) {
    const localImageBase = path.parse(localImagePath).base;
    const remoteImage = this.storage.bucket(bucketName)
      .file(`images/${localImageBase}`);

    return new Promise((resolve, reject) => {
      fs.createReadStream(localImagePath)
        .pipe(remoteImage.createWriteStream({ metadata }))
        .on('error', (err) => {
          reject(
            new Error(`Fail to upload ${localImagePath}: ${err.message}`));
        })
        .on('finish', () => {
          remoteImage.getSignedUrl({
            action: 'read',
            expires: '01-01-2500',
          }, (err, url) => {
            if (err) {
              reject(err);
            }

            resolve(url);
          });
        });
    })
      .catch(err => Promise.reject(err));
  }

}

module.exports = GCloud;
