/* eslint-disable no-param-reassign */

import i18next from 'i18next';
import axios from 'axios';
import { uniqueId, differenceBy } from 'lodash';

const getData = (url) => axios({
  url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  timeout: 5000,
}).then((response) => response.data.contents)
  .catch((err) => {
    console.error(err);
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

const generatePostId = (length, index) => String(length - index);

const findNewPosts = (currentFeeds, updatedFeed, feedId) => {
  const { posts: updatedPosts } = updatedFeed;
  const [currentFeed] = currentFeeds.filter((feed) => feed.id === feedId);
  const { posts: currentPosts } = currentFeed;
  return differenceBy(updatedPosts, currentPosts, 'title');
};

const isPostRead = (postTitle, readPosts) => {
  const readPostsTitles = readPosts.map(({ title }) => title);
  const isRead = readPostsTitles.includes(postTitle);
  return isRead;
};

const processPosts = (state, feed, feedId) => {
  const newPosts = findNewPosts(state.feeds, feed, feedId);
  state.updatedData.push(...newPosts);
  const titles = state.updatedData.map((post) => post.title);
  feed.posts.forEach((post) => {
    const isNew = titles.includes(post.title);
    post.read = isPostRead(post.title, state.readPosts);
    if (isNew) {
      post.status = 'new';
    }
    return post;
  });
};

const buildFeed = (doc, url, feedId = uniqueId(), status = 'adding', state) => {
  try {
    const channelElem = doc.querySelector('rss channel');
    const title = channelElem.querySelector('title').textContent;
    const feedDesc = channelElem.querySelector('description').textContent;
    const postElems = channelElem.querySelectorAll('item');
    const posts = Array.from(postElems).map((elem, index, arr) => {
      const postDesc = elem.querySelector('description').textContent;
      return {
        feedId,
        id: generatePostId(arr.length, index),
        title: elem.querySelector('title').textContent,
        description: postDesc,
        link: elem.querySelector('link').textContent,
        pubDate: elem.querySelector('pubDate').textContent,
        read: false,
      };
    })
    .catch((err) => {
      console.error(err);
      throw new Error('errors.unexpectedBehavior');
    });

    const feed = {
      url,
      title,
      feedDesc,
      posts,
      id: feedId,
    };

    if (status === 'updating') {
      processPosts(state, feed, feedId);
    }
    return feed;
  } catch (err) {
    console.log(err);
    throw new Error(i18next.t('errors.unexpectedBehavior'));
  }
};

const processUpdates = (data, state) => {
  const promises = data.map(({ content, url }, index, arr) => {
    const feedId = String(arr.length - index);
    const parsedData = parse(content);
    return parsedData.then((doc) => buildFeed(doc, url, feedId, 'updating', state));
  });
  const promise = Promise.all(promises);
  promise.then((newFeeds) => {
    state.feeds = newFeeds;
  });
};

const updateFeeds = (state) => {
  const urls = state.feeds.map(({ url }) => url);
  const promises = urls.map(getData);
  const promise = Promise.all(promises);

  return promise
    .then((contents) => {
      clearTimeout(state.updateTimer);
      state.updateTimer = setTimeout(() => {
        updateFeeds(state);
      }, 5000);

      const data = contents.map((content, index) => ({ content, url: urls[index] }));
      processUpdates(data, state);
    })
    .catch((err) => {
      console.log(err);
      clearTimeout(state.updateTimer);
      state.updateTimer = setTimeout(() => {
        updateFeeds(state);
      }, 5000);
    });
};

export default {
  getData,
  parse,
  buildFeed,
  updateFeeds,
};
