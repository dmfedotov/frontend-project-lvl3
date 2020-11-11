/* eslint-disable no-param-reassign  */

import rss from './rss';
import validate from './validate';
import watcher from './view';

const updateValidationState = (state) => validate.byUrl(state.form)
  .then(({ url }) => validate.byDuplicate(state.feeds, url))
  .then((url) => rss.getData(url))
  .then(() => {
    state.form.valid = true;
    state.form.errors = [];
  })
  .catch((err) => {
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
  // const submitButton = form.querySelector('button');

  form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(evt.target);
    watchedState.form.url = formData.get('url');
    watchedState.form.processState = 'sending';
    updateValidationState(watchedState);
  });
};
