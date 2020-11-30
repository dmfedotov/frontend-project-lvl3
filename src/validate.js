import i18next from 'i18next';
import * as yup from 'yup';

const schema = yup.object().shape({
  url: yup.string()
    .matches(/^(https?):\/\/[^\s$.?#].[^\s]*$/, 'Must be valid url'),
});

const byUrl = (form) => schema.validate(form);

const byDuplicate = (feeds, url) => {
  const urlMatches = feeds.filter((feed) => feed.url === url);
  return new Promise((resolve, reject) => {
    if (urlMatches.length === 0) {
      resolve(url);
      return;
    }
    reject(new Error(i18next.t('errors.duplicate')));
  });
};

const byContent = (content) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');
  const isRss = doc.querySelector('rss');

  if (isRss) {
    return new Promise((resolve) => resolve(doc));
  }
  return new Promise((_resolve, reject) => reject(new Error(i18next.t('errors.invalidContent'))));
};

export default {
  byUrl,
  byDuplicate,
  byContent,
};
