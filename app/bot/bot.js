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

  sendPostCards(recipient, posts) {
    if (posts.length === 0) {
      return Promise.reject(new Error('No post can be sent!'));
    }

    const elements = posts.map(({ from, imageUrl, placeName, placeAddress }) => ({
      image_url: imageUrl,
      title: placeName,
      subtitle: placeAddress,
      default_action: {
        type: 'web_url',
        url: from,
      },
      buttons: [
        {
          type: 'web_url',
          url: `https://www.google.com/maps/?q=${placeName}`,
          title: 'Go!',
        },
      ],
    }));

    return this.sendMessage(recipient, {
      attachment: {
        type: 'template',
        payload: {
          elements,
          template_type: 'generic',
        },
      },
    })
      .catch(err => Promise.reject(err));
  }

  sendPostCard(recipient, post) {
    return this.sendPostCards(recipient, [post])
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

  askLocation(recipient, question = '你在哪呢？') {
    return this.sendMessage(recipient, {
      text: question,
      quick_replies: [{ content_type: 'location' }],
    })
      .catch(err => Promise.reject(err));
  }

}

module.exports = Bot;
