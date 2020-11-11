import * as yup from 'yup';

const schema = yup.object().shape({
  url: yup.string()
    .matches(/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/,
      'Must be valid url')
    .required('Please enter rss'),
});

const byUrl = (form) => schema.validate(form);

const byDuplicate = (feeds, url) => {
  const urlMatches = feeds.filter((feed) => feed.url === url);
  const urlExist = urlMatches.length === 0;
  if (urlExist) {
    return new Promise((resolve) => resolve(url));
  }
  return new Promise((_resolve, reject) => reject(new Error('Rss already exists')));
};

export default {
  byUrl,
  byDuplicate,
};
