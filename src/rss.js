/* eslint-disable no-param-reassign */

import axios from 'axios';
import { differenceBy, uniqueId } from 'lodash';

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
  return doc;
};

const generateId = (length, index) => String(length - index);

const findNewPosts = (currentPosts, updatedPosts) => differenceBy(updatedPosts, currentPosts, 'title');

const buildFeed = (doc, url, id = uniqueId()) => {
  try {
    const channelElem = doc.querySelector('rss channel');
    const title = channelElem.querySelector('title').textContent;
    const feedDesc = channelElem.querySelector('description').textContent;

    return {
      url,
      title,
      description: feedDesc,
      id,
    };
  } catch (err) {
    console.error(err);
    throw new Error('errors.unexpectedBehavior');
  }
};

const buildPosts = (doc, feedId) => {
  try {
    const channelElem = doc.querySelector('rss channel');
    const postElems = channelElem.querySelectorAll('item');
    const posts = Array.from(postElems).map((elem, index, arr) => {
      const postDesc = elem.querySelector('description').textContent;
      const post = {
        feedId,
        id: generateId(arr.length, index),
        title: elem.querySelector('title').textContent,
        description: postDesc,
        link: elem.querySelector('link').textContent,
        read: false,
      };
      return post;
    });
    return posts;
  } catch (err) {
    console.error(err);
    throw new Error('errors.unexpectedBehavior');
  }
};

const autoupdate = (state) => setTimeout(() => {
  const urls = state.feeds.map(({ url }) => url);
  const promises = urls.map((url, index) => {
    const data = getData(url, state);
    const feedId = String(index + 1);
    return data
      .then((content) => {
        const parsedData = parse(content, state);
        return buildPosts(parsedData, feedId, state, 'updating');
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

export default {
  getData,
  parse,
  buildFeed,
  buildPosts,
  autoupdate,
};
