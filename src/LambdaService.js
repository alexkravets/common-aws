'use strict'

const config               = require('config')
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

  async executeAsync(operationId, parameters = {}, headers = {}) {
    if (global.mockService) {
      return global.mockService.request(operationId, parameters)
    }

    const { mutation: body, ...queryStringParameters } = parameters

    const request = {
      body,
      headers,
      operationId,
      queryStringParameters
    }

    const InvokeArgs   = JSON.stringify(request, null, 2)
    const FunctionName = this._functionName

    await this._method('invokeAsync', { FunctionName, InvokeArgs })
  }

  async execute(operationId, parameters = {}, headers = {}) {
    if (global.mockService) {
      return global.mockService.request(operationId, parameters)
    }

    const Payload      = this._createPayload(operationId, parameters, headers)
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

  _createPayload(operationId, parameters, headers) {
    parameters = JSON.parse(JSON.stringify(parameters))

    const { mutation } = parameters
    delete parameters.mutation

    const queryStringParameters = parameters
    const req = { operationId, queryStringParameters, headers }

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
}

module.exports = LambdaService
