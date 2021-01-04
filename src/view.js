/* eslint-disable no-param-reassign */

import onChange from 'on-change';
import i18next from 'i18next';
import { last } from 'lodash';

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
    feedback.textContent = i18next.t(error);
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

const buildList = (name) => {
  const listElem = document.querySelector(`.${name}`);
  if (listElem) {
    listElem.remove();
  }

  const list = document.createElement('ul');
  list.classList.add('list-group', 'mb-5', name);
  return list;
};

const newPosts = document.createDocumentFragment();
const renderPost = (list, posts, feedId) => {
  const postsContainerElem = document.querySelector('.posts');
  const titleElem = postsContainerElem.querySelector('h2');

  if (!titleElem) {
    const postsTitle = document.createElement('h2');
    postsTitle.textContent = i18next.t('titles.posts');
    postsContainerElem.append(postsTitle);
  }

  posts.forEach((post) => {
    const fontWeight = post.read ? 'normal' : 'bold';
    const li = document.createElement('li');
    li.style.fontWeight = fontWeight;
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    const link = document.createElement('a');
    link.textContent = post.title;
    link.href = post.link;
    link.setAttribute('data-feed-id', post.feedId);
    link.setAttribute('data-post-id', post.id);
    const modalButton = createModalButton(feedId, post.id);
    li.append(link, modalButton);

    if (post.status === 'new') {
      newPosts.append(li);
      return;
    }

    list.append(li);
  });

  list.prepend(newPosts);
  postsContainerElem.append(list);
};

const renderFeed = (feeds) => {
  const feedsContainerElem = document.querySelector('.feeds');
  const titleElem = feedsContainerElem.querySelector('h2');

  if (!titleElem) {
    const feedsTitle = document.createElement('h2');
    feedsTitle.textContent = i18next.t('titles.feeds');
    feedsContainerElem.append(feedsTitle);
  }

  const feedsList = buildList('feeds-list');
  const postsList = buildList('posts-list');

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

  feedsContainerElem.append(feedsList);
};

export default (state) => onChange(state, (path, value) => {
  const lastPartPath = last(path.split('.'));

  if (lastPartPath === 'read') {
    renderFeed(state.feeds);
  }

  switch (path) {
    case 'form.processState':
      formProcessStateHandler(value);
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
