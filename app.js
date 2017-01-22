const express = require('express');
const http = require('http');

const Bot = require('./bot.js');

const app = express();

const bot = new Bot(app, {
  appSecret: process.env.app_secret,
  pageAccessToken: process.env.page_access_token,
  verifyToken: process.env.verify_token,
}, '/messenger');

bot.on('error', console.log);

bot.on('message', (payload, reply) => {
  const { text } = payload.message;

  reply({ text })
    .catch((err) => {
      if (err) {
        throw err;
      }
    });
});

http.createServer(app).listen(3000);
