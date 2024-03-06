'use strict'

const getService = require('./getService')

const executeAsync = async (serviceName, operationId, parameters = {}) => {
  const service = getService(serviceName)
  const result = await service.executeAsync(operationId, parameters)

  return result
}

module.exports = executeAsync
