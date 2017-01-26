const Nightmare = require('nightmare');

const queryLocation = 'main article > header a[href*="locations"]';
const queryImage = 'main article > div img';

function loadPlace(url) {
  return new Nightmare()
    .goto(url)
    .wait('main article')
    .evaluate((query) => {
      const a = document.querySelector(query);

      if (a === null) {
        return null;
      }

      return a.innerHTML;
    }, queryLocation)
    .end()
    .then((result) => {
      if (result === null) {
        return Promise.reject(new Error('Location not found!'));
      }

      return result;
    })
    .catch(err => Promise.reject(err));
}

function loadImageUrl(url) {
  return new Nightmare()
    .goto(url)
    .wait('main article')
    .evaluate((query) => {
      const img = document.querySelector(query);

      if (img === null) {
        return null;
      }

      return img.getAttribute('src');
    }, queryImage)
    .end()
    .then((result) => {
      if (result === null) {
        return Promise.reject(new Error('Image not found!'));
      }

      return result;
    })
    .catch(err => Promise.reject(err));
}

module.exports = {
  loadPlace,
  loadImageUrl,
};
