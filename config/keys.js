module.exports = {
  google: {
    apiKey: process.env.google_api_key,
    gcloud: {
      projectId: process.env.gcloud_project_id,
      keyFile: process.env.gcloud_key_file,
    },
    firebase: {
      apiKey: process.env.firebase_api_key,
      authDomain: process.env.firebase_auth_domain,
      databaseUrl: process.env.firebase_database_url,
      storageBucket: process.env.firebase_storage_bucket,
    },
  },
  facebook: {
    appSecret: process.env.app_secret,
    pageAccessToken: process.env.page_access_token,
    verifyToken: process.env.verify_token,
  },
};
