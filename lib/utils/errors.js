export class InputError extends Error {
  /**
   * @param {string} message
   * @param {string} [body]
   * @param {ConstructorParameters<typeof Error>[1]} [options]
   */
  constructor (message, body, options) {
    super(message, options);

    /** @type {string|undefined} */
    this.body = body;
  }
}
