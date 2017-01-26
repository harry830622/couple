const rp = require('request-promise-native');

class Map {
  constructor(key) {
    this.key = key;
  }

  loadPlace(query) {
    return rp({
      uri: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
      qs: {
        query,
        key: this.key,
        language: 'zh-TW',
      },
      json: true,
    })
      .then((body) => {
        if (body.status !== 'OK') {
          return Promise.reject(
            new Error(`Fail to find ${query} on Google Map!`));
        }

        return body.results[0];
      })
      .catch(err => Promise.reject(err));
  }

  loadAddress(query) {
    return this.loadPlace(query)
      .then(place => place.formatted_address)
      .catch(err => Promise.reject(err));
  }

}

module.exports = Map;
