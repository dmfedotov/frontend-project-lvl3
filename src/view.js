/* eslint-disable no-param-reassign */

import onChange from 'on-change';
import i18next from 'i18next';

const inputField = document.querySelector('input');
const submitButton = document.querySelector('button[type="submit"]');
const feedback = document.querySelector('.feedback');

const renderSuccess = () => {
  feedback.classList.add('text-success');
  feedback.textContent = i18next.t('successMessage');
};

const renderError = (error) => {
  if (error) {
    feedback.classList.add('text-danger');
    inputField.classList.add('border-danger');
    feedback.textContent = error;
  }
};

const clearFeedback = () => {
  inputField.classList.remove('border-danger');
  feedback.classList.remove('text-danger', 'text-success');
  feedback.textContent = '';
};

const formProcessStateHandler = (processState) => {
  switch (processState) {
    case 'filling':
      inputField.disabled = false;
      submitButton.disabled = false;
      break;
    case 'sending':
      inputField.disabled = true;
      submitButton.disabled = true;
      clearFeedback();
      break;
    case 'failed':
      inputField.disabled = false;
      submitButton.disabled = false;
      break;
    case 'finished':
      inputField.disabled = false;
      inputField.value = '';
      submitButton.disabled = false;
      renderSuccess();
      break;
    default:
      throw new Error(`Unknown state: ${processState}`);
  }
};

const createLayout = () => {
  const container = document.createElement('div');
  container.classList.add('container-xl', 'feed-container');

  const feedsBlock = document.createElement('div');
  const postsBlock = document.createElement('div');
  feedsBlock.classList.add('row');
  postsBlock.classList.add('row');

  const feedsWrapper = document.createElement('div');
  const postsWrapper = document.createElement('div');
  feedsWrapper.classList.add('col-md-10', 'col-lg-8', 'mx-auto');
  postsWrapper.classList.add('col-md-10', 'col-lg-8', 'mx-auto');

  const feedsTitle = document.createElement('h2');
  feedsTitle.textContent = i18next.t('titles.feeds');
  const postsTitle = document.createElement('h2');
  postsTitle.textContent = i18next.t('titles.posts');

  const feedsList = document.createElement('ul');
  const postsList = document.createElement('ul');
  feedsList.classList.add('list-group', 'mb-5', 'feeds-list');
  postsList.classList.add('list-group', 'mb-5', 'posts-list');

  feedsWrapper.append(feedsTitle, feedsList);
  postsWrapper.append(postsTitle, postsList);
  feedsBlock.append(feedsWrapper);
  postsBlock.append(postsWrapper);
  container.append(feedsBlock, postsBlock);

  return container;
};

const createModalButton = (feedId, postId) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('btn', 'btn-primary', 'btn-sm');
  button.setAttribute('data-toggle', 'modal');
  button.setAttribute('data-target', '#modal');
  button.setAttribute('data-feed-id', feedId);
  button.setAttribute('data-post-id', postId);
  button.textContent = 'Preview';
  return button;
};

const renderModal = (data) => {
  const title = document.querySelector('.modal-title');
  const desc = document.querySelector('.modal-body');
  const link = document.querySelector('.full-article');
  title.textContent = data.title;
  desc.textContent = data.description;
  link.href = data.link;
};

const renderPost = (list, posts, feedId) => {
  posts.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    const link = document.createElement('a');
    link.textContent = post.title;
    link.href = post.link;
    link.setAttribute('data-id', post.id);
    const modalButton = createModalButton(feedId, post.id);
    li.append(link, modalButton);
    list.append(li);
  });
};

const renderFeed = (feeds) => {
  const mainElem = document.querySelector('main');
  const containerElem = mainElem.querySelector('.feed-container');

  if (containerElem) {
    containerElem.remove();
  }

  const container = createLayout();
  const feedsList = container.querySelector('.feeds-list');
  const postsList = container.querySelector('.posts-list');

  feeds.forEach((feed) => {
    const title = document.createElement('h3');
    title.textContent = feed.title;
    const description = document.createElement('p');
    description.textContent = feed.description;
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    li.append(title, description);
    feedsList.append(li);

    renderPost(postsList, feed.posts, feed.id);
  });

  mainElem.append(container);
};

export default (state) => onChange(state, (path, value) => {
  switch (path) {
    case 'form.processState':
      formProcessStateHandler(value);
      break;
    case 'form.valid':
      break;
    case 'form.processError':
      renderError(state.form.processError);
      break;
    case 'feeds':
      renderFeed(state.feeds);
      break;
    case 'modalData':
      renderModal(state.modalData);
      break;
    default:
      break;
  }
});
