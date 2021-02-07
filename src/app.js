/* eslint-disable no-param-reassign  */

import $ from 'jquery';
import axios from 'axios';
import { differenceBy, uniqueId } from 'lodash';
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
const httpTimeout = 10000;

const validateUrl = (value, urls) => {
  const schema = yup
    .string()
    .url('errors.invalidUrl')
    .notOneOf(urls, 'errors.duplicate');
  try {
    schema.validateSync(value);
    return null;
  } catch (err) {
    return err.message;
  }
};

const updateValidationState = (watchedState) => {
  const urls = watchedState.feeds.map((feed) => feed.url);
  const error = validateUrl(watchedState.form.url, urls);
  watchedState.form.valid = error === null;
  watchedState.form.processError = error;
};

const getProxyUrl = (url) => {
  const proxy = 'https://hexlet-allorigins.herokuapp.com/get?disableCache=true';
  return `${proxy}&url=${encodeURIComponent(url)}`;
};

const getData = (url) => axios({
  url: getProxyUrl(url),
  timeout: httpTimeout,
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
      })
      .catch(console.log);
  });

  return Promise.all(promises)
    .then(([updatedPosts]) => {
      const newPosts = getNewPosts(state.posts, updatedPosts);
      state.posts.unshift(...newPosts);
    })
    .finally(() => autoupdate(state));
}, updateDelay);

const getErrorName = (err) => {
  let error;
  if (axios.isAxiosError(err)) {
    error = 'errors.network';
  } else if (err.message === 'errors.parsing') {
    error = err.message;
  } else {
    error = 'errors.unknown';
  }
  return error;
};

const addRssFeed = (state) => {
  const { url } = state.form;

  return getData(url)
    .then((data) => {
      const feedData = parse(data);
      const feedId = uniqueId();
      const feed = buildFeed(feedData, url, feedId);
      const posts = buildPosts(feedData.posts, feed.id, state);

      state.feeds.unshift(feed);
      state.posts.unshift(...posts);
    })
    .then(() => {
      state.form.processState = 'finished';
      state.form.processError = null;
    })
    .catch((err) => {
      state.form.processState = 'failed';
      state.form.processError = getErrorName(err);
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
      valid: true,
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

    updateValidationState(watchedState);
    if (watchedState.form.valid) {
      watchedState.form.processState = 'sending';
      watchedState.form.processError = null;
      addRssFeed(watchedState);
    }
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

  autoupdate(watchedState);
});
