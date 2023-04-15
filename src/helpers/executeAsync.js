'use strict'

const LambdaService = require('../LambdaService')


const execute = async (serviceName, operationId, parameters = {}) => {
  const service = new LambdaService(serviceName)
  const result = await service.executeAsync(operationId, parameters)

  return result
}

module.exports = execute
