import { ConflictException } from '@nestjs/common';

export const validatePagination = (page: number, limit: number): void => {
  if (isNaN(Number(page)) || isNaN(Number(limit)) || page <= 0 || limit <= 0) {
    throw new ConflictException(
      'Page and limit should be of positive integers.',
    );
  }
};

export const validatePaginationLimit = (limit: number): number => {
  const MAX_ITEMS_PER_PAGE: number = 20;
  const newLimit: number =
    limit > MAX_ITEMS_PER_PAGE ? MAX_ITEMS_PER_PAGE : limit;

  return newLimit;
};

export const validatePaginationFields = (
  page: number,
  limit: number,
): number => {
  validatePagination(page, limit);
  const newLimit: number = validatePaginationLimit(limit);
  return newLimit;
};
