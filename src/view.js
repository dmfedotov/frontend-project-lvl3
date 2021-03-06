/* eslint-disable no-param-reassign */

import onChange from 'on-change';
import i18next from 'i18next';
import { isEmpty } from 'lodash';
import getRequiredPost from './utils';

const inputField = document.querySelector('input');
const submitButton = document.querySelector('button[type="submit"]');
const feedback = document.querySelector('.feedback');

const renderSuccess = () => {
  feedback.classList.add('text-success');
  feedback.textContent = i18next.t('successMessage');
};

const renderError = (error) => {
  feedback.classList.add('text-danger');
  inputField.classList.add('border-danger');
  feedback.textContent = i18next.t(error);
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

const buildModalButton = (feedId, postId) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('btn', 'btn-primary', 'btn-sm');
  button.setAttribute('data-toggle', 'modal');
  button.setAttribute('data-target', '#modal');
  button.setAttribute('data-feed-id', feedId);
  button.setAttribute('data-post-id', postId);
  button.setAttribute('data-mark', 'read');
  button.textContent = 'Preview';
  return button;
};

const renderModal = (posts, postId) => {
  const post = getRequiredPost(posts, postId);
  const title = document.querySelector('.modal-title');
  const desc = document.querySelector('.modal-body');
  const link = document.querySelector('.full-article');
  title.textContent = post.title;
  desc.textContent = post.description;
  link.href = post.link;
};

const buildList = (className) => {
  const list = document.createElement('ul');
  list.classList.add('list-group', 'mb-5', className);
  return list;
};

const buildTitle = (text) => {
  const title = document.createElement('h2');
  title.textContent = i18next.t(text);
  return title;
};

const renderFeeds = (feeds) => {
  const feedsContainerElem = document.querySelector('.feeds');
  feedsContainerElem.innerHTML = '';

  const list = buildList('feeds-list');
  const listTitle = buildTitle('titles.feeds');

  feedsContainerElem.append(listTitle);

  feeds.forEach((feed) => {
    const title = document.createElement('h3');
    title.textContent = feed.title;
    const description = document.createElement('p');
    description.textContent = feed.description;
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    li.append(title, description);
    list.append(li);
  });

  feedsContainerElem.append(list);
};

const renderPosts = (posts, readPosts) => {
  const postsContainerElem = document.querySelector('.posts');
  postsContainerElem.innerHTML = '';

  if (isEmpty(posts)) {
    return;
  }

  const list = buildList('posts-list');
  const listTitle = buildTitle('titles.posts');

  postsContainerElem.append(listTitle);

  posts.forEach((post) => {
    const li = document.createElement('li');
    li.style.fontWeight = readPosts.has(post.id) ? 'normal' : 'bold';
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    const link = document.createElement('a');
    link.textContent = post.title;
    link.href = post.link;
    link.setAttribute('data-feed-id', post.feedId);
    link.setAttribute('data-post-id', post.id);
    link.setAttribute('data-mark', 'read');
    const modalButton = buildModalButton(post.feedId, post.id);
    li.append(link, modalButton);
    list.append(li);
  });

  postsContainerElem.append(list);
};

export default (state) => onChange(state, (path, value) => {
  switch (path) {
    case 'form.processState':
      formProcessStateHandler(value);
      break;
    case 'form.processError':
      if (value !== null) {
        renderError(state.form.processError);
      }
      break;
    case 'feeds':
      renderFeeds(state.feeds);
      break;
    case 'posts':
      renderPosts(state.posts, state.uiState.readPosts);
      break;
    case 'uiState.modal.postId':
      renderModal(state.posts, state.uiState.modal.postId);
      break;
    case 'uiState.readPosts':
      renderPosts(state.posts, state.uiState.readPosts);
      break;
    default:
      break;
  }
});
