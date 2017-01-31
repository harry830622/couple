const projectId = 'couple-156506';

module.exports = {
  apiKey: process.env.google_api_key,
  gcloud: {
    projectId,
    keyFile: process.env.gcloud_key_file,
    storage: {
      bucketName: `${projectId}.appspot.com`,
    },
  },
  firebase: {
    apiKey: process.env.firebase_api_key,
    authDomain: `${projectId}.firebaseapp.com`,
    databaseUrl: `https://${projectId}.firebaseio.com`,
    storageBucket: `${projectId}.appspot.com`,
  },
};
