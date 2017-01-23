const express = require('express');
const http = require('http');

const ig = require('./ig.js');
const Bot = require('./bot.js');

const app = express();

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

    bot.sendSenderAction(recipient, 'typing_on')
      .then(() => ig.loadLocation(url))
      .then((location) => {
        reply({ text: location });
      })
      .then(() => bot.sendSenderAction(recipient, 'typing_off'))
      .catch((err) => {
        reply({ text: err.message });
      });
  }
});

http.createServer(app).listen(3000);
