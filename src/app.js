/* eslint-disable no-param-reassign  */

import rss from './rss';
import validate from './validate';
import watcher from './view';

const addRssFeed = (state) => validate.byUrl(state.form)
  .then(({ url }) => validate.byDuplicate(state.feeds, url))
  .then((url) => rss.getData(url))
  .then(() => {
    state.form.processState = 'finished';
    state.form.valid = true;
    state.form.error = null;
  })
  .catch((err) => {
    state.form.processState = 'filling';
    state.form.valid = false;
    state.form.error = err.message;
  });

export default () => {
  const state = {
    form: {
      processState: 'filling',
      processError: null,
      url: '',
      valid: true,
      error: null,
    },
    feeds: [],
  };

  const watchedState = watcher(state);

  const form = document.querySelector('.rss-form');

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(evt.target);
    watchedState.form.url = formData.get('url');
    watchedState.form.processState = 'sending';
    try {
      addRssFeed(watchedState);
    } catch (err) {
      watchedState.form.processState = 'failed';
      throw err;
    }
  });
};
