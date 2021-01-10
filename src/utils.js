export default (posts, feedId, postId) => posts.find((post) => {
  const result = (post.feedId === feedId && post.id === postId);
  return result;
});
