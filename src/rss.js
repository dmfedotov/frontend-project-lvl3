import i18next from 'i18next';
import axios from 'axios';
import { uniqueId } from 'lodash';

const getData = (url) => axios({
  url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  timeout: 5000,
}).then((response) => response.data.contents);

const parse = (content) => new Promise((resolve) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');
  resolve(doc);
});

const generatePostId = (index) => index + 1;

const buildFeed = (doc, url, feedId = uniqueId()) => {
  const promise = Promise.resolve();
  return promise
    .then(() => {
      const channelElem = doc.querySelector('rss channel');
      const title = channelElem.querySelector('title').textContent;
      const description = channelElem.querySelector('description').textContent;
      const postElems = channelElem.querySelectorAll('item');
      const posts = Array.from(postElems).map((elem, index) => ({
        feedId,
        id: generatePostId(index),
        title: elem.querySelector('title').textContent,
        link: elem.querySelector('link').textContent,
      }));

      return {
        url,
        title,
        description,
        posts,
        id: feedId,
      };
    })
    .catch((err) => {
      console.log(err);
      throw new Error(i18next.t('errors.unexpectedBehavior'));
    });
};

export default {
  getData,
  parse,
  buildFeed,
};
