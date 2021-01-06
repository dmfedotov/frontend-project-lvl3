/* eslint-disable no-param-reassign */

import axios from 'axios';
import { without, differenceBy } from 'lodash';

const getData = (url, state, isUpdate) => axios({
  url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  timeout: 5000,
}).then((response) => response.data.contents)
  .catch((err) => {
    if (state.urls.length === 1 && !isUpdate) {
      state.urls = [];
    }
    throw err;
  });

const parse = (data, state) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  const error = doc.querySelector('parsererror');
  if (error) {
    state.urls = without(state.urls, state.form.url);
    throw new Error('errors.invalidContent');
  }
  return doc;
};

const generateId = (length, index) => String(length - index);

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

const buildFeed = (doc, url, feedId) => {
  try {
    const channelElem = doc.querySelector('rss channel');
    const title = channelElem.querySelector('title').textContent;
    const feedDesc = channelElem.querySelector('description').textContent;

    return {
      url,
      title,
      description: feedDesc,
      id: feedId,
    };
  } catch (err) {
    console.error(err);
    throw new Error('errors.unexpectedBehavior');
  }
};

const buildPosts = (doc, feedId, state, status) => {
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
        pubDate: elem.querySelector('pubDate').textContent,
      };
      post.read = isPostRead(post.title, state.readPosts);
      return post;
    });
    return posts;
  } catch (err) {
    console.error(err);
    throw new Error('errors.unexpectedBehavior');
  }
};

const getFeed = (state, status) => {
  const promises = state.urls.map((url, index) => {
    const data = getData(url, state, status);
    const feedId = String(index + 1);
    return data
      .then((content) => {
        const parsedData = parse(content, state);
        const feed = buildFeed(parsedData, url, feedId, state, status);
        const posts = buildPosts(parsedData, feed.id, state, status);
        return {
          feed,
          posts,
        };
      });
  });
  return Promise.all(promises)
    .then((result) => {
      const feeds = result.map((el) => el.feed);
      const posts = [];
      result.forEach((el) => {
        posts.unshift(...el.posts);
      });
      state.feeds = feeds;
      state.posts = posts;
    });
};

const autoupdate = (state) => setTimeout(() => {
  getFeed(state, 'updating')
    .finally(() => autoupdate(state))
    .catch(console.log);
}, 5000);

export default {
  buildFeed,
  getFeed,
  autoupdate,
};
