export class CompgitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthError extends CompgitError {}

export class RateLimitError extends CompgitError {
  readonly resetAt: Date;

  constructor(message: string, resetAt: Date) {
    super(message);
    this.resetAt = resetAt;
  }
}

export class NetworkError extends CompgitError {
  readonly underlying?: unknown;

  constructor(message: string, underlying?: unknown) {
    super(message);
    this.underlying = underlying;
  }
}

export class ValidationError extends CompgitError {
  readonly details: unknown;

  constructor(message: string, details: unknown) {
    super(message);
    this.details = details;
  }
}
