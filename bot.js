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

  sendPlaceCard(recipient, url, image, name, address) {
    return this.sendMessage(recipient, {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [
            {
              image_url: image,
              title: name,
              subtitle: address,
              default_action: {
                url,
                type: 'web_url',
              },
              buttons: [
                {
                  type: 'web_url',
                  url: `https://www.google.com/maps/?q=${name}`,
                  title: 'Go!',
                },
              ],
            },
          ],
        },
      },
    })
    .catch(err => Promise.reject(err));
  }

  sendQuestion(recipient, question, options) {
    return this.sendMessage(recipient, {
      text: question,
      quick_replies: options.map(({ text, payload }) => ({
        payload,
        content_type: 'text',
        title: text,
      })),
    })
    .catch(err => Promise.reject(err));
  }
}

module.exports = Bot;
