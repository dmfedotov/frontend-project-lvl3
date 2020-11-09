import * as yup from 'yup';

const schema = yup.object().shape({
  url: yup.string()
    .matches(/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/,
      'Must be valid url')
    .required('Please enter rss'),
});

const byUrl = (form) => schema.validate(form);

export default {
  byUrl,
};
