const config = require.main.require('./config');
const Bot = require.main.require('./app/bot');
const { Firebase } = require.main.require('./app/database');
const { GCloud } = require.main.require('./app/storage');
const { ig } = require.main.require('./app/crawler');
const { GoogleMap, network } = require.main.require('./app/utilities');

const co = require('co');
const express = require('express');
const path = require('path');

const server = express();

const map = new GoogleMap(config.google.apiKey);

const db = new Firebase({
  apiKey: config.google.firebase.apiKey,
  authDomain: config.google.firebase.authDomain,
  databaseURL: config.google.firebase.databaseUrl,
  storageBucket: config.google.firebase.storageBucket,
});

const storage = new GCloud({
  projectId: config.google.gcloud.projectId,
  keyFile: config.google.gcloud.keyFile,
});

const bot = new Bot(server, {
  appSecret: config.facebook.appSecret,
  pageAccessToken: config.facebook.pageAccessToken,
  verifyToken: config.facebook.verifyToken,
}, '/bot');

bot.on('error', (err) => {
  throw err;
});

bot.on('message', (res) => {
  const { message } = res;
  const recipient = res.sender.id;

  co(function* flow() {
    yield bot.sendSenderAction(recipient, 'mark_seen');
    yield bot.sendSenderAction(recipient, 'typing_on');

    if (message.quick_reply) {
      const payload = JSON.parse(message.quick_reply.payload);

      switch (payload.action) {
        case 'UPDATE_POST_PRIORITY': {
          yield db.setPost(payload.post.id, 'priority', payload.post.priority);

          yield bot.sendMessage(recipient, {
            text: '祈禱 Harry 會盡快帶你去吧哈哈',
          });

          break;
        }
        case 'SET_POST_PLACE_TYPE': {
          yield db.setPlace(payload.place.id, 'type', payload.place.type);

          yield bot.sendQuestion(recipient, '想去？', [
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
          ]);

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

        yield bot.sendSenderAction(recipient, 'mark_seen');
        yield bot.sendSenderAction(recipient, 'typing_on');

        const placeName = yield ig.loadPlaceName(url);
        const mapResult = yield map.loadPlace(placeName);
        const placeAddress = mapResult.formatted_address;

        const placeId = yield db.addPlace({
          name: placeName,
          address: placeAddress,
          location: {
            latitude: mapResult.geometry.location.lat,
            longitude: mapResult.geometry.location.lng,
          },
        });

        const profile = yield bot.getProfile(recipient);
        const by = profile.gender === 'male' ? 'Harry' : 'Wendy';

        const postId = yield db.addPost({
          by,
          placeId,
          imageUrl: '',
          from: url,
        });

        yield db.setPlace(placeId, 'postId', postId);

        const imageUrl = yield ig.loadImageUrl(url);
        const localImagePath = yield network
          .downloadImage(imageUrl, postId, '.tmp/images/');
        const ext = path.parse(localImagePath).ext;
        const contentType = (ext === 'png') ? 'image/png' : 'image/jpeg';

        const newImageUrl = yield storage.uploadImage(localImagePath, {
          contentType,
          metadata: { place: placeName },
        }, config.google.gcloud.storage.bucketName);

        yield db.setPost(postId, 'imageUrl', newImageUrl);

        yield bot.sendPostCard(recipient, {
          placeName,
          placeAddress,
          from: url,
          imageUrl: newImageUrl,
        });

        yield bot.sendQuestion(recipient, '種類？', [
          {
            text: '吃',
            payload: JSON.stringify({
              action: 'SET_POST_PLACE_TYPE',
              post: {
                id: postId,
              },
              place: {
                id: placeId,
                type: 'eat',
              },
            }),
          },
          {
            text: '喝',
            payload: JSON.stringify({
              action: 'SET_POST_PLACE_TYPE',
              post: {
                id: postId,
              },
              place: {
                id: placeId,
                type: 'drink',
              },
            }),
          },
          {
            text: '玩',
            payload: JSON.stringify({
              action: 'SET_POST_PLACE_TYPE',
              post: {
                id: postId,
              },
              place: {
                id: placeId,
                type: 'play',
              },
            }),
          },
        ]);
      }
    }

    if (message.attachments) {
      const { attachments } = message;

      if (attachments[0].type === 'location') {
        const { lat, long } = attachments[0].payload.coordinates;
        const km = 0;
        const range = 0.01 * km;

        const placesSortedByLat = yield db.placesBetween('location/latitude',
          lat - range, lat + range);
        const placesSortedByLng = yield db.placesBetween('location/longitude',
          long - range, long + range);

        const placesNearby = placesSortedByLat
          .filter(placeLat => placesSortedByLng.map(placeLng => placeLng.name)
            .includes(placeLat.name));

        if (placesNearby.length === 0) {
          yield bot.sendMessage(recipient, { text: '附近沒東西QQ' });
        } else {
          let postCards = [];
          for (let i = 0; i < placesNearby.length; i += 1) {
            if (i === 10) {
              break;
            }

            const { name, address, postId } = placesNearby[i];

            const post = yield db.post(postId);

            postCards = postCards.concat([{
              from: post.from,
              imageUrl: post.imageUrl,
              placeName: name,
              placeAddress: address,
              priority: post.priority,
            }]);
          }

          // TODO: Stable sort is better.
          postCards.sort((a, b) => b.priority - a.priority);

          yield bot.sendPostCards(recipient, postCards);
        }
      }
    }

    yield bot.sendSenderAction(recipient, 'typing_off');
  })
    .catch((err) => {
      bot.sendMessage(recipient, { text: err.message });
    });
});

bot.on('postback', (res) => {
  const payload = JSON.parse(res.postback.payload);
  const recipient = res.sender.id;

  co(function* flow() {
    switch (payload.action) {
      case 'HELP': {
        break;
      }
      case 'LIST_POSTS': {
        const posts = yield db.posts(10, 'priority');

        if (posts.length === 0) {
          yield bot.sendMessage(recipient, { text: 'Nothing to show TT' });
          break;
        }

        posts.reverse();
        let postCards = [];
        for (let i = 0; i < posts.length; i += 1) {
          const { from, imageUrl, placeId } = posts[i];

          const place = yield db.place(placeId);

          postCards = postCards.concat([{
            from,
            imageUrl,
            placeName: place.name,
            placeAddress: place.address,
          }]);
        }

        yield bot.sendPostCards(recipient, postCards);

        break;
      }
      case 'LIST_NEARBY_POSTS': {
        yield bot.askLocation(recipient);

        break;
      }
      default: {
        break;
      }
    }
  })
    .catch((err) => {
      bot.sendMessage(recipient, { text: err.message });
    });
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

module.exports = {
  server,
};
