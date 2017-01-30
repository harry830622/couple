const fs = require('fs');
const path = require('path');
const url = require('url');
const request = require('request');

function downloadImage(imageUrl, imageName, to) {
  const ext = path.parse(url.parse(imageUrl).pathname).ext;

  if (!['.jpg', '.png'].includes(ext)) {
    return Promise.reject(new Error(`Extension ${ext} not supported!`));
  }

  const localImagePath = to + imageName + ext;

  return new Promise((resolve, reject) => {
    request(imageUrl)
      .pipe(fs.createWriteStream(localImagePath))
      .on('error', (err) => {
        reject(new Error(`Fail to download ${imageUrl}: ${err.message}`));
      })
      .on('finish', () => {
        resolve(localImagePath);
      });
  });
}

module.exports = {
  downloadImage,
};
