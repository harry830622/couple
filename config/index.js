const keys = require('./keys.js');

const port = process.argv[2] || 8080;

module.exports = {
  port,
  keys,
};
