export const getPreviewUrl = (url, size = 'preview') => {
  // TheSportsDB /preview suffix sometimes causes 404s or CORS issues depending on the image.
  // Returning the original URL ensures the image loads correctly.
  return url;
};
