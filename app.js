const express = require('express');
const http = require('http');

const ig = require('./ig.js');
const Map = require('./map.js');
const Bot = require('./bot.js');

const app = express();

const map = new Map({ key: process.env.google_api_key });

const bot = new Bot(app, {
  appSecret: process.env.app_secret,
  pageAccessToken: process.env.page_access_token,
  verifyToken: process.env.verify_token,
}, '/messenger');

bot.on('error', (err) => {
  throw err;
});

bot.on('message', (payload, reply) => {
  const { text } = payload.message;
  const recipient = payload.sender.id;

  bot.sendSenderAction(recipient, 'mark_seen');

  if (text.includes('instagram.com/p/')) {
    const url = text;

    const result = {};
    bot.sendSenderAction(recipient, 'typing_on')
      .then(() => ig.loadLocation(url))
      .then((location) => {
        Object.assign(result, { location });
      })
      .then(() => map.address(result.location))
      .then((body) => {
        const address = body.results[0].formatted_address;
        Object.assign(result, { address });
      })
      .then(() => ig.loadImage(url))
      .then((image) => {
        Object.assign(result, { image });
      })
      .then(() => reply({
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                image_url: result.image,
                title: result.location,
                subtitle: result.address,
                default_action: {
                  url,
                  type: 'web_url',
                },
              },
            ],
          },
        },
      }))
      .then(() => reply({
        text: '想吃？',
        quick_replies: [
          {
            content_type: 'text',
            title: '超想吃！',
            payload: JSON.stringify({ priority: 5 }),
          },
          {
            content_type: 'text',
            title: '先記著再說哈哈',
            payload: JSON.stringify({ priority: 3 }),
          },
        ],
      }))
      .then(() => bot.sendSenderAction(recipient, 'typing_off'))
      .catch((err) => {
        reply({ text: err.message });
      });
  }
});

http.createServer(app).listen(3000);
