const Nightmare = require('nightmare');

const queryLocation = 'main article > header a[href*="locations"]';
const queryImage = 'main article > div img';

function loadLocation(url) {
  return new Nightmare()
    .goto(url)
    .wait('main article')
    .evaluate(query => document.querySelector(query).innerHTML, queryLocation)
    .end();
}

function loadImage(url) {
  return new Nightmare()
    .goto(url)
    .wait('main article')
    .evaluate(query =>
      document.querySelector(query).getAttribute('src'), queryImage)
    .end();
}

module.exports = {
  loadLocation,
  loadImage,
};
