import slugify from 'slugify';

export const generateSlug = (name: string): string => {
  return slugify(name, {
    strict: true,
    lower: true,
  });
};
