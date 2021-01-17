/* eslint-disable no-param-reassign */

import { uniqueId } from 'lodash';

const parse = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/xml');
  const error = doc.querySelector('parsererror');
  if (error) {
    throw new Error('errors.parsing');
  }

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
};

const buildFeed = (data, url, id) => {
  const feed = { ...data, url, id: String(id) };
  return feed;
};

const buildPosts = (data, feedId) => {
  const posts = data.map((item) => {
    const id = uniqueId();
    return { ...item, id, feedId };
  });
  return posts;
};

export {
  parse,
  buildFeed,
  buildPosts,
};
