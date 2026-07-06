import { BadRequestException } from '@nestjs/common';

/* Encode the cursor-payload  */
export const encodeCursor = (createdAt: Date, id: string): string => {
  const payload = JSON.stringify({
    createdAt: createdAt.toISOString(),
    id: id,
  });

  return Buffer.from(payload).toString('base64url');
};

/* Decode the cursor-payload */
export const decodeCursor = (
  cursor: string,
): { createdAt: string; id: string } => {
  try {
    const payload = Buffer.from(cursor, 'base64url').toString('utf8');
    return JSON.parse(payload) as { createdAt: string; id: string };
  } catch {
    throw new BadRequestException('Invalid cursor string. Please try again.');
  }
};
