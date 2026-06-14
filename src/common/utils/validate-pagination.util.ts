import { ConflictException } from '@nestjs/common';

export const validatePagination = (page: number, limit: number): void => {
  if (isNaN(Number(page)) || isNaN(Number(limit)) || page <= 0 || limit <= 0) {
    throw new ConflictException(
      'Page and limit should be of positive integers.',
    );
  }
};
