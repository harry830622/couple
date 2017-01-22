const bodyParser = require('body-parser');

const MessengerBot = require('messenger-bot');

class Bot extends MessengerBot {
  constructor(app, { appSecret, pageAccessToken, verifyToken }, url = '/') {
    super({
      app_secret: appSecret,
      token: pageAccessToken,
      verify: verifyToken,
    });

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get(url, (req, res) => this._verify(req, res));

    app.post(url, (req, res) => {
      this._handleMessage(req.body);
      res.end(JSON.stringify({ status: 'ok' }));
    });
  }
}

module.exports = Bot;
