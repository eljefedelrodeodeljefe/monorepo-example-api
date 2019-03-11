const { isFunction, isPlainObject, negate } = require('lodash')
const importFrom = require('./import-from')

const requirePlugin = _module => {
  // fixing upstream regression here. Force to require only from string, else fail completely
  if (Array.isArray(_module) && _module.length === 1) _module = _module[0]
  if (typeof _module !== 'string') throw TypeError('Requireable module must be string.')
  importFrom(process.cwd(), _module)
}

const pluginsFromTypeConfig = config =>
  []
    .concat((config && config.path) || config || [])
    .filter(negate(isPlainObject))
    .map(value => (isFunction(value) ? value : requirePlugin(value)))

const pluginFromTypeConfig = (config, type, index) =>
  pluginsFromTypeConfig(config, type)[index]

const resolvePluginFn = (config, type, _default = null, index = 0) => {
  const plugin =
    pluginFromTypeConfig(config, type, index) ||
    (_default && requirePlugin(_default))

  return isPlainObject(plugin) ? plugin[type] : plugin
}

const wrapPlugin = (namespace, type, fn, _default = null, index = 0) => {
  return async (pluginConfig, config) => {
    const { [namespace]: { [type]: typeConfig } = {} } = pluginConfig
    const plugin = resolvePluginFn(typeConfig, type, _default, index)

    if (!plugin || (Array.isArray(typeConfig) && typeConfig.length <= index)) {
      return
    }

    return fn(plugin)(
      {
        ...pluginConfig,
        ...(isPlainObject(typeConfig) ? typeConfig : undefined)
      },
      config
    )
  }
}

const wrapMultiPlugin = (namespace, type, fn, _default = []) => {
  return Array(10)
    .fill(null)
    .map((value, index) => {
      return wrapPlugin(namespace, type, fn, _default[index], index)
    })
}

module.exports = {
  pluginFromTypeConfig,
  pluginsFromTypeConfig,
  wrapPlugin,
  wrapMultiPlugin
}
