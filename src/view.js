import onChange from 'on-change';

// const inputField = document.querySelector('input');

/* const renderError = (errors) => {
  const error = errors;
};
*/

export default (state) => onChange(state, (path) => {
  switch (path) {
    case 'form.processState':
      console.log('state: ', state);
      console.log('Обновился processState');
      break;
    case 'form.valid':
      console.log('State ', state);
      console.log('Валидность обновилась');
      break;
    default:
      break;
  }
});
