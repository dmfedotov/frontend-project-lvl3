/* eslint-disable no-param-reassign  */

import $ from 'jquery';
import i18next from 'i18next';
import * as yup from 'yup';
import {
  getData, parse, buildFeed, buildPosts, autoupdate,
} from './rss';
import getRequiredPost from './utils';
import resources from './locales';
import watcher from './view';

const validateUrl = (value, urls) => {
  const schema = yup
    .string()
    .url('errors.invalidUrl')
    .notOneOf(urls, 'errors.duplicate');
  return schema.validate(value);
};

const addRssFeed = (state) => {
  const { url } = state.form;
  const urls = state.feeds.map((feed) => feed.url);
  const feedsCount = state.feeds.length;

  return validateUrl(url, urls)
    .then(() => getData(url))
    .then((data) => {
      const parsedData = parse(data);

      const feed = buildFeed(parsedData, url, feedsCount);
      const posts = buildPosts(parsedData, feed.id, state);

      state.feeds.unshift(feed);
      state.posts.unshift(...posts);
    })
    .then(() => {
      state.form.processState = 'finished';
      state.form.processError = null;

      if (feedsCount === 1) {
        autoupdate(state);
      }
    })
    .catch((err) => {
      state.form.processState = 'failed';
      state.form.processError = err.message;
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
      modal: {},
      readPosts: [],
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
    const { feedId } = target.dataset;
    const { postId } = target.dataset;
    return getRequiredPost(watchedState.posts, feedId, postId);
  };

  const modal = $('#modal');
  modal.on('show.bs.modal', ({ relatedTarget }) => {
    const clickedPost = getClickedPost(relatedTarget);
    watchedState.uiState.modal = {
      feedId: clickedPost.feedId,
      postId: clickedPost.id,
    };
  });

  const feedContainer = document.querySelector('.feed-container');
  feedContainer.addEventListener('click', ({ target }) => {
    if (target.tagName === 'A' || target.tagName === 'BUTTON') {
      const clickedPost = getClickedPost(target);
      const data = {
        feedId: clickedPost.feedId,
        id: clickedPost.id,
      };
      const isPostExisted = getRequiredPost(watchedState.uiState.readPosts, data.feedId, data.id);

      if (!isPostExisted) {
        watchedState.uiState.readPosts.push(data);
      }
    }
  });
});
