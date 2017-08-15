const { MessengerClient } = require('messaging-api-messenger');

const { Chromeless } = require('chromeless');

const { URL } = require('url');

const bot = MessengerClient.connect(
  'EAAY4pXkMBQgBAMsxsm6Gm5TagRETcu55Wa9R89bbh2cCfSNbifFOiyZBYVt0ndgTy5RdiryyZB3ODtZBUlsrBklc1tHSm1snS2ZBawMHtGObZCVFqv2ZB3DsIVt2md0Oc7txmarve04ohtZAilq9MDXO7IvFZC9vh8xMbelRaElndjE73u99rWTw',
);

async function flow(event) {
  const { sender, message } = event;

  const browser = new Chromeless();

  if (message) {
    const { text } = message;

    if (text) {
      let isTextUrl = true;
      try {
        const _ = new URL(text);
      } catch (error) {
        isTextUrl = false;
      }

      if (isTextUrl) {
        const url = new URL(text);

        if (url.hostname === 'www.instagram.com') {
          const placeName = await browser
            .goto(url.toString())
            .wait('main article')
            .evaluate(() => {
              const a = document.querySelector(
                'main article > header a[href*="locations"]',
              );

              if (a === null) {
                return '未知';
              }

              return a.innerHTML;
            });

          await bot.sendText(sender.id, placeName);
        }
      } else {
        await bot.sendText(sender.id, text);
      }
    }
  }

  await browser.end();
}

module.exports = { flow };
