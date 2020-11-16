import onChange from 'on-change';

const inputField = document.querySelector('input');
const submitButton = document.querySelector('button');
const feedbackElem = document.querySelector('.feedback');

const renderSuccess = () => {
  feedbackElem.classList.add('text-success');
  feedbackElem.textContent = 'Rss has been loaded';
};

const renderError = (error) => {
  if (error) {
    feedbackElem.classList.add('text-danger');
    inputField.classList.add('border-danger');
    feedbackElem.textContent = error;
  }
};

const clearFeedback = () => {
  inputField.classList.remove('border-danger');
  feedbackElem.classList.remove('text-danger', 'text-success');
  feedbackElem.textContent = '';
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

const renderPost = (list, posts) => {
  posts.forEach((post) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    const link = document.createElement('a');
    link.textContent = post.title;
    link.href = post.link;
    li.append(link);
    list.append(li);
  });
};

const renderFeed = (feeds) => {
  const mainElem = document.querySelector('main');
  const containerElem = mainElem.querySelector('.feed-container');
  if (containerElem) {
    containerElem.remove();
  }

  const container = document.createElement('div');
  container.classList.add('container-xl', 'feed-container');
  const feedsBlock = document.createElement('div');
  const postsBlock = document.createElement('div');
  feedsBlock.classList.add('row');
  postsBlock.classList.add('row');
  const feedsWrapper = document.createElement('div');
  const postsWrapper = document.createElement('div');
  feedsWrapper.classList.add('col-md-10', 'mx-auto');
  postsWrapper.classList.add('col-md-10', 'mx-auto');
  const feedsTitle = document.createElement('h2');
  const postsTitle = document.createElement('h2');
  const feedsList = document.createElement('ul');
  const postsList = document.createElement('ul');
  feedsList.classList.add('list-group-5');
  postsList.classList.add('list-group-5');

  feedsWrapper.append(feedsTitle, feedsList);
  postsWrapper.append(postsTitle, postsList);
  feedsBlock.append(feedsWrapper);
  postsBlock.append(postsWrapper);
  container.append(feedsBlock, postsBlock);

  feeds.forEach((feed) => {
    feedsTitle.textContent = 'Feeds';
    const title = document.createElement('h3');
    title.textContent = feed.title;
    const description = document.createElement('p');
    description.textContent = feed.description;
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    li.append(title, description);
    feedsList.append(li);
    renderPost(postsList, feed.posts);
  });

  mainElem.append(container);
};

export default (state) => onChange(state, (path, value) => {
  switch (path) {
    case 'form.processState':
      formProcessStateHandler(value);
      console.log(state);
      break;
    case 'form.valid':
      break;
    case 'form.error':
      renderError(state.form.error);
      break;
    case 'feeds':
      renderFeed(state.feeds);
      break;
    default:
      break;
  }
});
