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

  if (text.includes('instagram.com/p/')) {
    const url = text;

    const result = {};
    bot.sendSenderAction(recipient, 'mark_seen')
      .then(() => bot.sendSenderAction(recipient, 'typing_on'))
      .then(() => ig.loadLocation(url))
      .then(location => Object.assign(result, { location }))
      .then(() => map.address(result.location))
      .then(body =>
        Object.assign(result, { address: body.results[0].formatted_address }))
      .then(() => ig.loadImage(url))
      .then(image => Object.assign(result, { image }))
      .then(() => bot.sendPlaceCard(
        recipient, url, result.location, result.address, result.image))
      .then(() => bot.sendQuestion(recipient, '想去？', [
        {
          text: '超想去！',
          payload: JSON.stringify({ priority: 5 }),
        },
        {
          text: '先記著再說哈哈',
          payload: JSON.stringify({ priority: 3 }),
        },
      ]))
      .then(() => bot.sendSenderAction(recipient, 'typing_off'))
      .catch((err) => {
        reply({ text: err.message });
      });
  }
});

http.createServer(app).listen(8080);
