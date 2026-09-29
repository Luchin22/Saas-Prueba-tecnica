import { ArgumentsHost, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

function createHost(): { host: ArgumentsHost; response: { status: jest.Mock; json: jest.Mock } } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status, json };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'GET', url: '/api/v1/test' }),
    }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  it('formats an HttpException with a string response body', () => {
    const { host, response } = createHost();
    filter.catch(new HttpException('Not allowed', HttpStatus.FORBIDDEN), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.FORBIDDEN, message: 'Not allowed' }),
    );
  });

  it('formats an HttpException with an object response body', () => {
    const { host, response } = createHost();
    filter.catch(new BadRequestException(['email must be valid']), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['email must be valid'],
      }),
    );
  });

  it('falls back to a generic 500 response for unknown errors', () => {
    const { host, response } = createHost();
    filter.catch(new Error('boom'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
  });

  it('handles non-Error thrown values', () => {
    const { host, response } = createHost();
    filter.catch('some string throw', host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
