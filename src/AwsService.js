'use strict'

const AWS     = require('aws-sdk')
const config  = require('config')
const options = {}

if (process.env.NODE_ENV !== 'lambda') {
  const profile  = config.get('provider.profile')
  options.region = config.get('provider.region')
  options.credentials = new AWS.SharedIniFileCredentials({ profile })
}

class AwsService {
  constructor(_options = {}) {
    if (!this.service) {
      throw new Error('AWS service is not defined')
    }

    this._provider = new AWS[this.service]({
      ...options,
      ..._options
    })
  }

  get service() {
    return null
  }

  async _method(methodName, ...args) {
    if (global.mockService) {
      const result = global.mockService.request(methodName, args)
      return result
    }

    const promise = new Promise((resolve, reject) =>
      this._provider[methodName](...args, (error, result) => {
        if (error) { return reject(error) }
        return resolve(result)
      }))

    return promise
  }
}

module.exports = AwsService
