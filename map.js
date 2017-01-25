const rp = require('request-promise-native');

class Map {
  constructor({ key }) {
    this.key = key;
  }

  address(query) {
    return rp({
      uri: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
      qs: {
        query,
        key: this.key,
        language: 'zh-TW',
      },
      json: true,
    })
    .catch(err => Promise.reject(err));
  }

}

module.exports = Map;
