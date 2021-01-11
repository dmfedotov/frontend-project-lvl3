/* eslint-disable no-param-reassign */

import axios from 'axios';
import { differenceBy } from 'lodash';

const getProxyUrl = (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

const getData = (url) => axios({
  url: getProxyUrl(url),
  timeout: 5000,
}).then((response) => response.data.contents)
  .catch((err) => {
    console.log(err);
    throw err;
  });

const parse = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  const error = doc.querySelector('parsererror');
  if (error) {
    throw new Error('errors.invalidContent');
  }

  try {
    const channelElem = doc.querySelector('rss channel');
    const postElems = channelElem.querySelectorAll('item');
    const title = channelElem.querySelector('title').textContent;
    const description = channelElem.querySelector('description').textContent;
    const posts = [...postElems].map((post) => {
      const postTitle = post.querySelector('title').textContent;
      const postDesc = post.querySelector('description').textContent;
      const link = post.querySelector('link').textContent;
      return { title: postTitle, description: postDesc, link };
    });
    return { title, description, posts };
  } catch (err) {
    console.error(err);
    throw new Error('errors.unexpectedBehavior');
  }
};

const findNewPosts = (currentPosts, updatedPosts) => differenceBy(updatedPosts, currentPosts, 'title');

const buildFeed = (data, url, id) => {
  const feed = { ...data, url, id: String(id) };
  return feed;
};

const buildPosts = (data, feedId) => {
  const posts = data.map((item, index, arr) => {
    const id = String(arr.length - index);
    return { ...item, id, feedId };
  });
  return posts;
};

const autoupdate = (state) => setTimeout(() => {
  const urls = state.feeds.map(({ url }) => url);

  const promises = urls.map((url, index) => {
    const data = getData(url, state);
    const feedId = String(index + 1);
    return data
      .then((content) => {
        const feedData = parse(content);
        return buildPosts(feedData.posts, feedId);
      });
  });

  return Promise.all(promises)
    .then(([updatedPosts]) => {
      const newPosts = findNewPosts(state.posts, updatedPosts);
      state.posts.unshift(...newPosts);
    })
    .finally(() => autoupdate(state))
    .catch(console.log);
}, 5000);

export {
  getData,
  parse,
  buildFeed,
  buildPosts,
  autoupdate,
};
