const firebase = require('firebase');

class Firebase {
  constructor({ apiKey, authDomain, databaseURL, storageBucket }) {
    firebase.initializeApp({
      apiKey,
      authDomain,
      databaseURL,
      storageBucket,
    });

    this.db = firebase.database();
  }

  place(id) {
    const placeRef = this.db.ref('places').child(id);

    return placeRef.once('value')
      .then(snapshot => snapshot.val())
      .catch(err => Promise.reject(err));
  }

  post(id) {
    const postRef = this.db.ref('posts').child(id);

    return postRef.once('value')
      .then(snapshot => snapshot.val())
      .catch(err => Promise.reject(err));
  }

  placesBetween(orderBy, start, end) {
    const placesRef = this.db.ref('places');

    return placesRef.orderByChild(orderBy).startAt(start).endAt(end)
      .once('value')
      .then((snapshot) => {
        let places = [];
        snapshot.forEach((childSnapshot) => {
          places = places.concat([childSnapshot.val()]);
        });

        return places;
      })
      .catch(err => Promise.reject(err));
  }

  places(numPlaces, orderBy = 'name') {
    const placesRef = this.db.ref('places');

    return placesRef.orderByChild(orderBy).limitToLast(numPlaces)
      .once('value')
      .then((snapshot) => {
        let places = [];
        snapshot.forEach((childSnapshot) => {
          places = places.concat([childSnapshot.val()]);
        });

        return places;
      })
      .catch(err => Promise.reject(err));
  }

  posts(numPosts, orderBy = 'timestamp') {
    const postsRef = this.db.ref('posts');

    return postsRef.orderByChild(orderBy).limitToLast(numPosts).once('value')
      .then((snapshot) => {
        let posts = [];
        snapshot.forEach((childSnapshot) => {
          posts = posts.concat([childSnapshot.val()]);
        });

        return posts;
      })
      .catch(err => Promise.reject(err));
  }

  addPlace({ name, address, location }) {
    const placeRef = this.db.ref('places').push();
    const id = placeRef.key;

    return placeRef.set({
      name,
      address,
      location,
      type: 'eat',
      postId: '',
    })
      .then(() => id)
      .catch(err => Promise.reject(err));
  }

  addPost({ by, from, imageUrl, placeId }) {
    const postRef = this.db.ref('posts').push();
    const id = postRef.key;

    return postRef.set({
      by,
      from,
      placeId,
      imageUrl,
      priority: 3,
      timestamp: Date.now(),
    })
      .then(() => id)
      .catch(err => Promise.reject(err));
  }

  set(ref, data) {
    return this.db.ref(ref)
      .set(data)
      .catch(err => Promise.reject(err));
  }

  setPlace(id, child, data) {
    return this.set(`places/${id}/${child}`, data)
      .catch(err => Promise.reject(err));
  }

  setPost(id, child, data) {
    return this.set(`posts/${id}/${child}`, data)
      .catch(err => Promise.reject(err));
  }

  update(ref, data) {
    return this.db.ref(ref)
      .update(data)
      .catch(err => Promise.reject(err));
  }

  updatePlace(id, child, data) {
    return this.update(`places/${id}/${child}`, data)
      .catch(err => Promise.reject(err));
  }

  updatePost(id, child, data) {
    return this.update(`posts/${id}/${child}`, data)
      .catch(err => Promise.reject(err));
  }

}

module.exports = Firebase;
