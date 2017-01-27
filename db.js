const fs = require('fs');
const path = require('path');
const firebase = require('firebase');
const gs = require('@google-cloud/storage');

const util = require('./util.js');

class Db {
  constructor(projectId, keyFile, apiKey, authDomain, databaseURL, storageBucket) {
    firebase.initializeApp({
      apiKey,
      authDomain,
      databaseURL,
      storageBucket,
    });

    this.db = firebase.database();
    this.bucket = gs({
      projectId,
      keyFilename: keyFile,
    }).bucket('couple-156506.appspot.com');
  }

  uploadImage(localImagePath, metadata) {
    const localImageBase = path.parse(localImagePath).base;
    const remoteImage = this.bucket.file(`images/${localImageBase}`);

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

  addPost({ by, from, imageUrl, place }) {
    const postRef = this.db.ref('posts').push();
    const id = postRef.key;

    return util.downloadImage(imageUrl, id, '.tmp/images/')
      .then((localImagePath) => {
        const ext = path.parse(localImagePath).ext;
        const contentType = (ext === 'png') ? 'image/png' : 'image/jpeg';

        return this.uploadImage(localImagePath, {
          contentType,
          metadata: { place: place.name },
        });
      })
      .then(newImageUrl => postRef.set({
        id,
        by,
        from,
        place,
        imageUrl: newImageUrl,
        priority: 3,
        timestamp: Date.now(),
      }))
      .then(() => id)
      .catch(err => Promise.reject(err));
  }

  updatePost(id, data) {
    const postRef = this.db.ref('posts').child(id);

    return postRef.update(data)
      .catch(err => Promise.reject(err));
  }

}

module.exports = Db;
