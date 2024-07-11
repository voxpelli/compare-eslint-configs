export class InputError extends Error {
  /** @override */
  name = 'InputError';

  /**
   * @param {string} message
   * @param {string} [body]
   */
  constructor (message, body) {
    super(message);

    /** @type {string|undefined} */
    this.body = body;
  }
}

export class ResultError extends Error {
  /** @override */
  name = 'ResultError';
}
