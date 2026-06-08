import {
  ValidationPipe,
  ValidationError,
  BadRequestException,
} from '@nestjs/common';

export const CustomValidationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  stopAtFirstError: false,
  exceptionFactory: (errors: ValidationError[]) => {
    const formatErrors = (validationErrors: ValidationError[]) => {
      return validationErrors.map((err) => ({
        field: err.property,
        messages: Object.values(err.constraints || {}),
      }));
    };

    return new BadRequestException({
      message: 'Validation failed.',
      details: formatErrors(errors),
    });
  },
});
