/* eslint-disable no-param-reassign  */

import $ from 'jquery';
import i18next from 'i18next';
import * as yup from 'yup';
import rss from './rss';
import resources from './locales';
import watcher from './view';

const validate = (value, urls) => {
  const schema = yup
    .string()
    .url('errors.invalidUrl')
    .notOneOf(urls, 'errors.duplicate');
  return schema.validate(value);
};

const addRssFeed = (state) => {
  const { url } = state.form;
    .then(() => rss.getData(url))
    .then(rss.parse)
    .then((doc) => {
      const feed = rss.buildFeed(doc, url);
      state.feeds.unshift(feed);
  return validate(url, state.urls)
    })
    .then(() => {
      state.form.processState = 'finished';
      state.form.valid = true;
      state.form.processError = null;
    })
    .then(() => {
      clearTimeout(state.updateTimer);
      state.updateTimer = setTimeout(() => rss.updateFeeds(state), 5000);
    })
    .catch((err) => {
      state.form.processState = 'failed';
      state.form.valid = false;
      state.form.processError = err.message;
    });
};

export default async () => {
  await i18next.init({
    lng: 'en',
    resources,
  });

  const state = {
    form: {
      processState: 'filling',
      processError: null,
      url: '',
    },
    urls: [],
    feeds: [],
    updatedData: [],
    updateTimer: 0,
    modalData: {},
    readPosts: [],
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
    const [clickedPost] = watchedState.feeds
      .filter((feed) => feed.id === feedId)[0].posts
      .filter((post) => post.id === postId);
    return clickedPost;
  };

  const modal = $('#modal');
  modal.on('show.bs.modal', ({ relatedTarget }) => {
    const clickedPost = getClickedPost(relatedTarget);
    watchedState.modalData = {
      title: clickedPost.title,
      description: clickedPost.description,
      link: clickedPost.link,
    };
  });

  const feedContainer = document.querySelector('.feed-container');
  feedContainer.addEventListener('click', ({ target }) => {
    if (target.tagName === 'A' || target.tagName === 'BUTTON') {
      const clickedPost = getClickedPost(target);
      clickedPost.read = true;
      watchedState.readPosts.push(clickedPost);
    }
  });
};
