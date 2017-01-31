const google = require('./google.js');
const facebook = require('./facebook.js');

const port = process.argv[2] || 8080;

module.exports = {
  port,
  google,
  facebook,
};
