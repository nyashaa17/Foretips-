export const slugify = (text = '') => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w-]+/g, '')     // Remove all non-word chars
    .replace(/--+/g, '-');       // Replace multiple - with single -
};

export const generateMatchSlug = (home, away, id) => {
  const h = slugify(home || 'home');
  const a = slugify(away || 'away');
  return `${h}-vs-${a}-${id}`;
};
