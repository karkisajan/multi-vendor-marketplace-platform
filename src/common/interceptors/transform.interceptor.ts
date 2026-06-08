import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
  timestamp: string;
  [key: string]: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data: any) => {
        // If data is an object and has a message property, use it for the top-level message
        const message =
          data && typeof data === 'object' && data.message
            ? data.message
            : 'Success';

        // Extract extra properties (like meta, limit, etc.) if data is wrapped
        let extraProps = {};
        if (data && typeof data === 'object' && 'data' in data) {
          const { data: _, message: __, ...rest } = data;
          extraProps = rest;
        }

        // If data was wrapped in a standard structure already, or we want to pass only the 'data' part
        const resultData =
          data && typeof data === 'object' && 'data' in data ? data.data : data;

        // Clean up data if it has the message property we extracted
        let finalData = resultData;
        if (
          resultData === data &&
          data &&
          typeof data === 'object' &&
          data.message
        ) {
          const { message: _, ...rest } = data;
          finalData = rest;
        }

        return {
          success: true,
          message,
          data: finalData,
          ...extraProps,
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
