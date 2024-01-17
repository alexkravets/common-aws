'use strict'

const config = require('config')
const LambdaService = require('../LambdaService')

const SERVICES = config.has('services')
  ? config.get('services')
  : {}

const SERVICES_MAP = {}
const SERVICE_NAMES = Object.keys(SERVICES)

for (const serviceName of SERVICE_NAMES) {
  SERVICES_MAP[serviceName] = new LambdaService(serviceName)
}

const getService = name => {
  const service = SERVICES_MAP[name]

  if (!service) {
    throw new Error(`Service ${name} is not configured`)
  }

  return service
}

module.exports = getService
