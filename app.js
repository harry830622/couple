const express = require('express');
const http = require('http');

const ig = require('./ig.js');
const Map = require('./map.js');
const Db = require('./db.js');
const Bot = require('./bot.js');

const app = express();

const map = new Map(process.env.google_api_key);

const db = new Db(
  process.env.gcloud_project_id,
  process.env.gcloud_key_file,
  process.env.firebase_api_key,
  process.env.firebase_auth_domain,
  process.env.firebase_database_url,
  process.env.firebase_storage_bucket);

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

    const post = { from: url };
    const place = {};
    bot.sendSenderAction(recipient, 'mark_seen')
      .then(() => bot.sendSenderAction(recipient, 'typing_on'))
      .then(() => bot.getProfile(recipient))
      .then((profile) => {
        const by = profile.gender === 'male' ? 'Harry' : 'Wendy';

        Object.assign(post, { by });

        return ig.loadPlace(post.from);
      })
      .then((name) => {
        Object.assign(place, { name });

        return map.address(place.name);
      })
      .then((body) => {
        Object.assign(place, { address: body.results[0].formatted_address });

        return ig.loadImageUrl(post.from);
      })
      .then((imageUrl) => {
        Object.assign(post, { imageUrl });

        return bot.sendPlaceCard(
          recipient, post.from, post.imageUrl, place.name, place.address);
      })
      .then(() => bot.sendSenderAction(recipient, 'typing_on'))
      .then(() => {
        Object.assign(post, { place });

        return db.addPost(post);
      })
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
