export class RankParseError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'RankParseError';
    this.code = code;
    this.status = status;
  }
}

export class AuthError extends RankParseError {
  constructor(m: string, c: string) {
    super(m, c, 401);
    this.name = 'AuthError';
  }
}

export class InsufficientCreditsError extends RankParseError {
  constructor(m: string, c: string) {
    super(m, c, 402);
    this.name = 'InsufficientCreditsError';
  }
}

export class NotFoundError extends RankParseError {
  constructor(m: string, c: string) {
    super(m, c, 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends RankParseError {
  constructor(m: string, c: string) {
    super(m, c, 429);
    this.name = 'RateLimitError';
  }
}

export class APIError extends RankParseError {}
