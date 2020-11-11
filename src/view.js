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

export default (state) => onChange(state, (path, value) => {
  switch (path) {
    case 'form.processState':
      formProcessStateHandler(value);
      break;
    case 'form.valid':
      break;
    case 'form.error':
      renderError(state.form.error);
      break;
    default:
      break;
  }
});
