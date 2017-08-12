const Koa = require('koa');
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');
const send = require('koa-send');

const { MessengerClient } = require('messaging-api-messenger');

const bot = MessengerClient.connect(
  'EAAY4pXkMBQgBAKVWUbX9efHxHjKLFDRy5jAXhpju0g6eNbNbh9YQH5Xj3A9NSi1dryC4Uo5kkBonGRd4XpYPvrwnEEWgu1Rce3OmZBtgqiijveLhtclWVG1UmbnaREpvdz14zlCBZAEMwzwia0gzEEQyjFSUKasTfLKmKRJrXTNCZA0qL2E',
);

const server = new Koa();

server.use(bodyParser());

server.use(
  route.get('/bot', async (ctx) => {
    if (
      ctx.query['hub.mode'] === 'subscribe' &&
      ctx.query['hub.verify_token'] === 'ilovewendy'
    ) {
      ctx.status = 200;
      ctx.body = ctx.query['hub.challenge'];
    } else {
      ctx.status = 403;
    }
  }),
);

server.use(
  route.post('/bot', async (ctx) => {
    const { body } = ctx.request;
    const { object, entry: entries } = body;

    if (object === 'page') {
      entries.forEach((entry) => {
        entry.messaging.forEach((e) => {
          const { sender, message } = e;

          if (message) {
            const { text } = message;

            if (text) {
            }
          }
        });
      });
    }

    ctx.status = 200;
  }),
);

server.use(
  route.get('/', async (ctx) => {
    await send(ctx, '/index.html');
  }),
);

server.listen(3000);
