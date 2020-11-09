import axios from 'axios';

const getData = (url) => axios({
  url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  timeout: 5000,
}).then((response) => response.data.contents);

export default {
  getData,
};
