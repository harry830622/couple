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
          .then(() => db.updatePost(payload.post.id, '', {
            priority: payload.post.priority,
          }))
          .then(() => bot.sendMessage(recipient, {
            text: '祈禱 Harry 會盡快帶你去吧哈哈',
          }))
          .then(() => bot.sendSenderAction(recipient, 'typing_off'))
          .catch((err) => {
            bot.sendMessage(recipient, { text: err.message });
          });

        break;
      }
      case 'SET_POST_PLACE_TYPE': {
        bot.sendSenderAction(recipient, 'mark_seen')
          .then(() => bot.sendSenderAction(recipient, 'typing_on'))
          .then(() => db.updatePost(payload.post.id, 'place', {
            type: payload.post.place.type,
          }))
          .then(() => bot.sendSenderAction(recipient, 'typing_on'))
          .then(() => bot.sendQuestion(recipient, '想去？', [
            {
              text: '超想去！',
              payload: JSON.stringify({
                action: 'UPDATE_POST_PRIORITY',
                post: {
                  id: payload.post.id,
                  priority: 5,
                },
              }),
            },
            {
              text: '先記著再說哈哈',
              payload: JSON.stringify({
                action: 'UPDATE_POST_PRIORITY',
                post: {
                  id: payload.post.id,
                  priority: 3,
                },
              }),
            },
          ]))
          .then(() => bot.sendSenderAction(recipient, 'typing_off'))
          .catch((err) => {
            bot.sendMessage(recipient, { text: err.message });
          });

        break;
      }
      default: {
        break;
      }
    }
  }

  if (message.text) {
    const { text } = message;

    if (text.includes('instagram.com/p/')) {
      const url = text;

      let post = { from: url };
      let place = { type: 'eat' };
      bot.sendSenderAction(recipient, 'mark_seen')
        .then(() => bot.sendSenderAction(recipient, 'typing_on'))
        .then(() => bot.getProfile(recipient))
        .then((profile) => {
          const by = profile.gender === 'male' ? 'Harry' : 'Wendy';

          post = Object.assign({}, post, { by });

          return ig.loadPlaceName(post.from);
        })
        .then((placeName) => {
          place = Object.assign({}, place, { name: placeName });

          return map.loadAddress(place.name);
        })
        .then((placeAddress) => {
          place = Object.assign({}, place, { address: placeAddress });
          post = Object.assign({}, post, { place });

          return ig.loadImageUrl(post.from);
        })
        .then((imageUrl) => {
          post = Object.assign({}, post, { imageUrl });

          return bot.sendPostCard(recipient, post);
        })
        .then(() => db.addPost(post))
        .then((postId) => {
          post = Object.assign({}, post, { id: postId });

          return post;
        })
        .then(() => bot.sendSenderAction(recipient, 'typing_on'))
        .then(() => bot.sendQuestion(recipient, '種類？', [
          {
            text: '吃',
            payload: JSON.stringify({
              action: 'SET_POST_PLACE_TYPE',
              post: {
                id: post.id,
                place: {
                  type: 'eat',
                },
              },
            }),
          },
          {
            text: '喝',
            payload: JSON.stringify({
              action: 'SET_POST_PLACE_TYPE',
              post: {
                id: post.id,
                place: {
                  type: 'drink',
                },
              },
            }),
          },
          {
            text: '玩',
            payload: JSON.stringify({
              action: 'SET_POST_PLACE_TYPE',
              post: {
                id: post.id,
                place: {
                  type: 'play',
                },
              },
            }),
          },
        ]))
        .then(() => bot.sendSenderAction(recipient, 'typing_off'))
        .catch((err) => {
          bot.sendMessage(recipient, { text: err.message });
        });
    }
  }
});

bot.on('postback', (res) => {
  const payload = JSON.parse(res.postback.payload);
  const recipient = res.sender.id;

  switch (payload.action) {
    case 'HELP': {
      break;
    }
    case 'LIST_POSTS': {
      db.posts('priority', 5)
        .then((posts) => {
          if (posts.length === 0) {
            return bot.sendMessage(recipient, { text: 'Nothing to show TT' });
          }

          return bot.sendPostCards(recipient, posts);
        })
        .catch(err => Promise.reject(err));
      break;
    }
    case 'LIST_NEARBY_POSTS': {
      break;
    }
    default: {
      break;
    }
  }
});

bot.setPersistentMenu([
  {
    type: 'postback',
    title: 'list',
    payload: JSON.stringify({ action: 'LIST_POSTS' }),
  },
  {
    type: 'postback',
    title: 'nearby',
    payload: JSON.stringify({ action: 'LIST_NEARBY_POSTS' }),
  },
  {
    type: 'postback',
    title: 'help',
    payload: JSON.stringify({ action: 'HELP' }),
  },
]);

app.listen(port);
