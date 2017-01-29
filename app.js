const express = require('express');

const ig = require('./ig.js');
const Map = require('./map.js');
const Db = require('./db.js');
const Bot = require('./bot.js');

const port = process.argv[2];

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
}, '/bot');

bot.on('error', (err) => {
  throw err;
});

bot.on('message', (res) => {
  const { message } = res;
  const recipient = res.sender.id;

  if (message.quick_reply) {
    const payload = JSON.parse(message.quick_reply.payload);

    switch (payload.action) {
      case 'UPDATE_POST_PRIORITY': {
        bot.sendSenderAction(recipient, 'mark_seen')
        .then(() => bot.sendSenderAction(recipient, 'typing_on'))
        .then(() => db.updatePost(payload.post.id, {
          priority: payload.post.priority,
        }))
        .then(() => bot.sendMessage(recipient, {
          text: '祈禱 Harry 會盡快帶你去吧可科',
        }))
        .then(() => bot.sendSenderAction(recipient, 'typing_off'))
        .catch((err) => {
          bot.sendMessage(recipient, { text: err.message });
        });

        break;
      }
      default:
        break;
    }
  }

  if (message.text) {
    const { text } = message;

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

          return ig.loadPlaceName(post.from);
        })
        .then((placeName) => {
          Object.assign(place, { name: placeName });

          return map.loadAddress(place.name);
        })
        .then((placeAddress) => {
          Object.assign(place, { address: placeAddress });

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
        .then((postId) => {
          Object.assign(post, { id: postId });

          return bot.sendQuestion(recipient, '想去？', [
            {
              text: '超想去！',
              payload: JSON.stringify({
                action: 'UPDATE_POST_PRIORITY',
                post: {
                  id: post.id,
                  priority: 5,
                },
              }),
            },
            {
              text: '先記著再說哈哈',
              payload: JSON.stringify({
                action: 'UPDATE_POST_PRIORITY',
                post: {
                  id: post.id,
                  priority: 3,
                },
              }),
            },
          ]);
        })
        .then(() => bot.sendSenderAction(recipient, 'typing_off'))
        .catch((err) => {
          bot.sendMessage(recipient, { text: err.message });
        });
    }
  }
});

app.listen(port);
