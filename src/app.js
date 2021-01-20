/* eslint-disable no-param-reassign  */

import $ from 'jquery';
import axios from 'axios';
import { compact, differenceBy, uniqueId } from 'lodash';
import i18next from 'i18next';
import * as yup from 'yup';
import {
  parse,
  buildFeed,
  buildPosts,
} from './parse';
import getRequiredPost from './utils';
import resources from './locales';
import watcher from './view';

const updateDelay = 5000;

const validateUrl = (value, urls) => {
  const schema = yup
    .string()
    .url('errors.invalidUrl')
    .notOneOf(urls, 'errors.duplicate');
  return schema.validate(value);
};

const getProxyUrl = (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`;

const getData = (url) => axios({
  url: getProxyUrl(url),
  timeout: 5000,
}).then((response) => response.data.contents);

const getNewPosts = (currentPosts, updatedPosts) => differenceBy(updatedPosts, currentPosts, 'link');

const autoupdate = (state) => setTimeout(() => {
  const urls = state.feeds.map(({ url }) => url);

  const promises = urls.map((url) => {
    const data = getData(url);
    const feedId = uniqueId();
    return data
      .then((content) => {
        const feedData = parse(content);
        return buildPosts(feedData.posts, feedId);
      });
  });

  return Promise.allSettled(promises)
    .then((result) => {
      const updatedPosts = compact(result.flatMap(({ value }) => value));
      const errors = compact(result.map(({ reason }) => reason));

      const newPosts = getNewPosts(state.posts, updatedPosts);
      state.posts.unshift(...newPosts);

      errors.forEach((err) => {
        const { url } = err.config;
        const reason = err.message;
        console.log(`Data on this url ${url} hasn't been updated. Reason: ${reason}`);
      });
    })
    .finally(() => autoupdate(state));
}, updateDelay);

const addRssFeed = (state) => {
  const { url } = state.form;
  const urls = state.feeds.map((feed) => feed.url);

  return validateUrl(url, urls)
    .then(() => getData(url))
    .then((data) => {
      const feedData = parse(data);
      const feedsCount = state.feeds.length + 1;
      const feed = buildFeed(feedData, url, feedsCount);
      const posts = buildPosts(feedData.posts, feed.id, state);

      state.feeds.unshift(feed);
      state.posts.unshift(...posts);
    })
    .then(() => {
      state.form.processState = 'finished';
      state.form.processError = null;

      if (state.feeds.length === 1) {
        autoupdate(state);
      }
    })
    .catch((err) => {
      const error = axios.isAxiosError(err) ? 'errors.network' : err.message;
      state.form.processState = 'failed';
      state.form.processError = error;
      console.log(err);
    });
};

export default () => i18next.init({
  lng: 'en',
  resources,
}).then(() => {
  const state = {
    form: {
      processState: 'filling',
      processError: null,
      url: '',
    },
    feeds: [],
    posts: [],
    uiState: {
      modal: { postId: '' },
      readPosts: new Set(),
    },
  };

  const watchedState = watcher(state);

  const form = document.querySelector('.rss-form');
  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(evt.target);
    watchedState.form.url = formData.get('url');
    watchedState.form.processState = 'sending';
    watchedState.form.processError = null;
    addRssFeed(watchedState);
  });

  const getClickedPost = (target) => {
    const { postId } = target.dataset;
    return getRequiredPost(watchedState.posts, postId);
  };

  const modal = $('#modal');
  modal.on('show.bs.modal', ({ relatedTarget }) => {
    const clickedPost = getClickedPost(relatedTarget);
    watchedState.uiState.modal.postId = clickedPost.id;
  });

  const feedContainer = document.querySelector('.feed-container');
  feedContainer.addEventListener('click', ({ target }) => {
    if (target.dataset.mark === 'read') {
      const clickedPost = getClickedPost(target);
      watchedState.uiState.readPosts.add(clickedPost.id);
    }
  });
});
