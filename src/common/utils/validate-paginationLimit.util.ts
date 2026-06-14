export const validatePaginationLimit = (limit: number): number => {
  const MAX_ITEMS_PER_PAGE: number = 20;
  const newLimit: number =
    limit > MAX_ITEMS_PER_PAGE ? MAX_ITEMS_PER_PAGE : limit;

  return newLimit;
};
