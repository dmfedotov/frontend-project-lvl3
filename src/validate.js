import * as yup from 'yup';

const schema = yup.object().shape({
  url: yup.string()
    .matches(/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/,
      'Must be valid url')
    .required('Please enter rss'),
});

const byUrl = (form) => schema.validate(form);

const byData = (data) => {};

const byDuplicate = (url) => {};

export default {
  byUrl,
  byData,
  byDuplicate,
};
