const { flow } = require('./bot.js');

const Koa = require('koa');
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');
const send = require('koa-send');

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
        entry.messaging.forEach((event) => {
          flow(event);
        });
      });
    }

    ctx.status = 200;
  }),
);

server.use(
  route.get('/', async (ctx) => {
    await send(ctx, '/index.html');

    ctx.status = 200;
  }),
);

server.listen(3000);
