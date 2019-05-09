/**
 * @file main
 * @author Cuttle Cong
 * @date 2019/5/9
 * @description
 */
const runTest = (mobxName = 'mobx') => {
  const { observable, configure, action, isObservable, isObservableProp } = require(mobxName)
  const { version } = require(mobxName + '/package.json')
  const { defineSymbolic, symbolicTarget, symbolicLink: link } = require('../..')

  configure && configure({ enforceActions: 'always' })

  console.log('mobx version: %s', version)

  const setProps = action((target, props) => Object.assign(target, props))

  class Src {
    @observable name = 'src'
    constructor(props) {
      setProps(this, props)
    }
  }

  class SrcP extends Src {
    @observable name = 'srcp'
    @observable abc = 'abc'
    constructor(props) {
      super(props)
      setProps(this, props)
    }
  }
  class Dest {
    @observable name = 'dest'
    constructor(props) {
      setProps(this, props)
    }
  }

  it('should unbroken mobx feature', () => {
    let dest = new Dest()
    expect(dest.hasOwnProperty('name')).toBeFalsy()
    dest.name
    expect(dest.hasOwnProperty('name')).toBeTruthy()

    let src = new SrcP()
    dest = new Dest()
    expect(src.hasOwnProperty('name')).toBeFalsy()
    let rm = link(dest, 'name', src, 'name')
    expect(dest.hasOwnProperty('name')).toBeTruthy()
    rm()
    expect(dest.hasOwnProperty('name')).toBeTruthy()
  })

  it('should main', () => {
    const srcp = new SrcP({ name: 'src' })
    const dest = new Dest()

    expect(srcp.name).toBe('src')
    const rm = link(srcp, 'name', dest, 'name')
    expect(srcp.name).toBe('dest')

    setProps(srcp, { name: '222' })
    expect(srcp.name).toBe('222')
    expect(dest.name).toBe('222')

    rm()

    expect(srcp.name).toBe('src')
  })

  it('should combine', function() {
    const define = (target, config) => {
      const rm = symbolicTarget(target, config)
      return {
        target,
        rm
      }
    }

    class Combine {
      @observable obj = {
        name: 'objName'
      }

      @observable srcp = new SrcP()

      @observable src = define(new Src(), {
        name: [this.obj, 'name']
      })

      srcX = define(new Src({ name: 'srcX' }), {
        name: [this.obj, 'name']
      })
    }

    const comb = new Combine()
    expect(comb.obj).toEqual({
      name: 'objName'
    })
    expect(Object.keys(comb.src.target)).toEqual(['name'])
    expect(comb.src.target).toEqual(
      expect.objectContaining({
        name: 'objName'
      })
    )
    expect(comb.srcX.target).toEqual(
      expect.objectContaining({
        name: 'objName'
      })
    )

    setProps(comb.srcX.target, { name: '666' })
    expect(comb.srcX.target).toEqual({
      name: '666'
    })
    expect(comb.obj).toEqual({
      name: '666'
    })
    expect(comb.src.target).toEqual({
      name: '666'
    })

    comb.srcX.rm()
    expect(comb.srcX.target).toEqual({
      name: 'srcX'
    })
    expect(isObservable(comb.srcX.target)).toBeTruthy()

    comb.src.rm()
    expect(comb.src.target).toEqual({
      name: 'src'
    })
    expect(isObservable(comb.src.target)).toBeTruthy()
  })
}

describe('mobx', () => {
  describe('mobx3', () => {
    runTest('./node_modules/mobx')
  })

  describe('mobx4', () => {
    runTest('../mobx4/node_modules/mobx')
  })

  describe('mobx5', () => {
    runTest('../mobx5/node_modules/mobx')
  })
})
