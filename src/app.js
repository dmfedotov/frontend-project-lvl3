/* eslint-disable no-param-reassign  */

import $ from 'jquery';
import i18next from 'i18next';
import rss from './rss';
import resources from './locales';
import validate from './validate';
import watcher from './view';

const addRssFeed = (state) => {
  const { url } = state.form;
  return validate.byUrl(state.form)
    .then(() => validate.byDuplicate(state.feeds, url))
    .then(rss.getData)
    .then(rss.parse)
    .then(validate.byContent)
    .then((doc) => rss.buildFeed(doc, url))
    .then((feed) => state.feeds.unshift(feed))
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
      valid: true,
    },
    feeds: [],
    updatedData: [],
    updateTimer: 0,
    modalData: {},
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

  const modal = $('#modal');
  modal.on('show.bs.modal', ({ relatedTarget }) => {
    const { feedId } = relatedTarget.dataset;
    const { postId } = relatedTarget.dataset;
    const [clickedPost] = state.feeds
      .flatMap(({ posts }) => posts)
      .filter((post) => (post.feedId === feedId && post.id === postId));
    watchedState.modalData = {
      title: clickedPost.title,
      description: clickedPost.description,
      link: clickedPost.link,
    };
  });
};
