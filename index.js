/**
 * Make the property links to other target like the symbolic link.
 * @author imcuttle
 */

function getDescriptor(target, propName, destTarget, destPropName, descriptor) {
  const prevDesc = Object.getOwnPropertyDescriptor(target, propName)

  return Object.assign(
    {
      configurable: true,
      enumerable: prevDesc && prevDesc.hasOwnProperty('enumerable') ? prevDesc.enumerable : true,
      get() {
        return destTarget[destPropName]
      },
      set(val) {
        destTarget[destPropName] = val
      }
    },
    descriptor
  )
}

function defineProperty(target, propName, destTarget, destPropName, descriptor) {
  const prevDesc = Object.getOwnPropertyDescriptor(target, propName)

  Object.defineProperty(target, propName, getDescriptor(target, propName, destTarget, destPropName, descriptor))

  return function() {
    if (prevDesc) {
      Object.defineProperty(target, propName, prevDesc)
    } else {
      delete target[propName]
    }
  }
}

function makeDisposeManager(fn) {
  return {
    disposes: [],
    apply() {
      const dispose = fn.apply(this, arguments)
      this.disposes.push(dispose)
      return dispose
    },
    dispose(reverse = false) {
      let disposes = this.disposes
      if (reverse) {
        disposes = disposes.reverse()
      }
      disposes.forEach(function(dispose) {
        if (typeof dispose === 'function') {
          dispose()
        }
      })
      this.reset()
    },
    reset() {
      this.disposes = []
    }
  }
}

/**
 * @public
 * @param srcTarget {any}
 * @param srcPropName {String|Symbol|Number}
 * @param destTarget {any}
 * @param destPropName {String|Symbol|Number}
 * @param descriptor {object}
 * @return dispose {Function}
 * @example
 * const obj = {}
 * const dest = { name: 'foo' }
 * const rm = symbolicLink(obj, 'name', dest, 'foo')
 *
 * obj.name === 'foo'
 * obj.name = 'bar'
 * dest.name = 'bar'
 *
 * rm()
 *
 * obj.name === undefined
 * dest.name === 'bar'
 */
export function symbolicLink(srcTarget, srcPropName, destTarget, destPropName, descriptor) {
  const manager = makeDisposeManager(defineProperty)

  // Call `srcTarget[srcPropName]` would trigger Initializer
  // But would make `srcTarget.hasOwnProperty(srcPropName) === true`
  //   And when I use the hack ways as follows, It makes `srcTarget.hasOwnProperty(srcPropName) === true` too
  srcTarget[srcPropName]

  // Hack for mobx@3 @observable
  /*
  if (srcTarget.__mobxLazyInitializers && typeof srcTarget.__mobxLazyInitializers.push === 'function') {
    srcTarget.__mobxLazyInitializers.push(function symbolicLinkDefine(instance) {
      manager.apply(instance, srcPropName, destTarget, destPropName, descriptor)
    })
  }
  // Hack for mobx@4 @observable
  else if (srcTarget.__mobxDecorators && srcTarget.__mobxDecorators[srcPropName]) {
    const decorator = srcTarget.__mobxDecorators[srcPropName]
    if (decorator && decorator.descriptor && decorator.descriptor.initializer) {
      const propertyCreator = decorator.propertyCreator
      decorator.propertyCreator = (instance, name, desc, ...argv) => {
        propertyCreator(instance, name, desc, ...argv)
        manager.apply(instance, srcPropName, destTarget, destPropName, descriptor)
      }

    }
  }
  */

  manager.apply(srcTarget, srcPropName, destTarget, destPropName, descriptor)

  return function() {
    manager.dispose()
  }
}

/**
 * @public
 * @param target {any}
 * @param config {{name: [destTarget, destPropName, descriptor]}}
 * @return dispose {Function}
 * @example
 * const obj = {}
 * const dest = { name: 'foo' }
 * const rm = symbolicTarget(obj, {
 *   name: [dest, 'name']
 * })
 *
 * obj.name === 'foo'
 * obj.name = 'bar'
 * dest.name === 'bar'
 * rm()
 *
 * obj.name === undefined
 * dest.name === 'bar'
 */
export function symbolicTarget(target, config) {
  const manager = makeDisposeManager(symbolicLink)
  Object.keys(config).forEach(function(name) {
    const [destTarget, destPropName, descriptor] = config[name]
    manager.apply(target, name, destTarget, destPropName, descriptor)
  })

  return function() {
    manager.dispose()
  }
}

/**
 * @public
 * @param target {any}
 * @param config {{name: [destTarget, destPropName, descriptor]}}
 * @return target {any}
 */
export function defineSymbolic(target, config) {
  symbolicTarget(target, config)
  return target
}
