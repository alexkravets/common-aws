'use strict'

class InternalRequestError extends Error {
  constructor(request, originalError) {
    const { message } = originalError

    super(message)

    this._request       = request
    this._originalError = originalError
  }

  get originalError() {
    return this._originalError
  }

  toJSON() {
    return {
      error:   this._originalError,
      request: this._request
    }
  }
}

module.exports = InternalRequestError
