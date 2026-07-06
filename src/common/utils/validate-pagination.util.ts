import { BadRequestException } from '@nestjs/common';

const MAX_LIMIT: number = 100;

export const normalizePagination = (
  page: number,
  limit: number,
): { normalizedPage: number; normalizedLimit: number } => {
  const pageNumber: number = Number(page);
  const limitNumber: number = Number(limit);

  if (!Number.isInteger(pageNumber) || pageNumber <= 0) {
    throw new BadRequestException('Page must be a positive integer');
  }

  if (!Number.isInteger(limitNumber) || limitNumber <= 0) {
    throw new BadRequestException('Limit must be a positive integer');
  }

  return {
    normalizedPage: pageNumber,
    normalizedLimit: Math.min(limitNumber, MAX_LIMIT),
  };
};
