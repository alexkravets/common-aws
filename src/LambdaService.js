'use strict'

const config               = require('config')
const cloneDeep            = require('lodash.clonedeep')
const AwsService           = require('./AwsService.js')
const InternalRequestError = require('./errors/InternalRequestError')

class LambdaService extends AwsService {
  constructor(serviceName, options) {
    super(options)

    this._functionName = config.get(`services.${serviceName}`)
  }

  get service() {
    return 'Lambda'
  }

  async execute(operationId, parameters = {}) {
    if (global.mockService) {
      return global.mockService.request(operationId, parameters)
    }

    const Payload      = this._createPayload(operationId, parameters)
    const FunctionName = this._functionName

    const {
      Payload:    responseJson,
      StatusCode: statusCode,
      ...rest
    } = await this._method('invoke', { FunctionName, Payload })

    const isSuccess = statusCode === 200

    if (!isSuccess) {
      throw new Error(`Function "${FunctionName}/${operationId}" has failed` +
        ` with status: ${statusCode}`, { responseJson, ...rest })
    }

    return this._processResponse(operationId, parameters, responseJson)
  }

  _createPayload(operationId, parameters) {
    parameters = cloneDeep(parameters)

    const { mutation } = parameters
    delete parameters.mutation

    const queryStringParameters = parameters
    const req = { operationId, queryStringParameters }

    if (mutation) {
      req.body = JSON.stringify(mutation, null, 2)
    }

    return JSON.stringify(req, null, 2)
  }

  _processResponse(operationId, parameters, responseJson) {
    const response = JSON.parse(responseJson)
    let { body: resultJson } = response

    if (!resultJson) { return }

    const result = JSON.parse(resultJson)
    const { error } = result

    if (!error) { return result }

    throw new InternalRequestError({ operationId, parameters }, error)
  }

  // TODO: Parameters verification should by taking service specification into
  //       consideration.
  // async executeAsync(operationId, parameters = {}) {
  //   if (global.mockService) {
  //     parameters.functionName = this.FunctionName
  //     return global.mockService.request(operationId, parameters)
  //   }

  //   const { mutation } = parameters
  //   delete parameters.mutation

  //   const queryStringParameters = parameters
  //   const req = { operationId, queryStringParameters }

  //   if (mutation) {
  //     req.body = JSON.stringify(mutation)
  //   }

  //   const InvokeArgs = JSON.stringify(req)
  //   const { FunctionName } = this

  //   await this._method('invokeAsync', {
  //     FunctionName,
  //     InvokeArgs
  //   })
  // }
}

module.exports = LambdaService
