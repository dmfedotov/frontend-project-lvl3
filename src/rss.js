import axios from 'axios';

const getData = (url) => axios({
  url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  timeout: 5000,
}).then((response) => response.data.contents);

const parse = (doc, url) => {
  const channelElem = doc.querySelector('rss channel');
  const title = channelElem.querySelector('title').textContent;
  const description = channelElem.querySelector('description').textContent;
  const postElems = channelElem.querySelectorAll('item');
  const posts = Array.from(postElems).map((elem) => ({
    title: elem.querySelector('title').textContent,
    link: elem.querySelector('link').textContent,
  }));

  return {
    url,
    title,
    description,
    posts,
  };
};

export default {
  getData,
  parse,
};
