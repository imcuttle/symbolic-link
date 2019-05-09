/**
 * @file main
 * @author imcuttle
 * @date 2018/4/4
 */
import { symbolicLink, symbolicTarget } from '../'

describe('symbolicLink', function() {
  it('should primitive argument works', function() {
    const src = {
      width: '123px'
    }
    const dest = {
      height: '345px'
    }

    const remove = symbolicLink(src, 'width', dest, 'height')
    expect(src.width).toBe('345px')

    src.width = '200px'
    expect(src.width).toBe('200px')
    expect(dest.height).toBe('200px')

    dest.height = '100px'
    expect(src.width).toBe('100px')
    expect(dest.height).toBe('100px')

    remove()

    expect(src.width).toBe('123px')
    expect(dest.height).toBe('100px')
  })

  it('should reference works', function() {
    let a = {}
    let b = {}
    const src = {
      width: a
    }
    const dest = {
      height: b
    }

    const remove = symbolicLink(src, 'width', dest, 'height')
    expect(src.width).toBe(b)
    expect(src.width).toBe(dest.height)

    remove()
    expect(src.width).toBe(a)
    expect(dest.height).toBe(b)
  })

  it('should extends previous descriptor', function() {
    const src = {}
    Object.defineProperty(src, 'a', {
      configurable: true,
      get() {
        return 'fixed'
      }
    })
    const dest = {
      a: '22'
    }

    expect(Object.keys(src)).toEqual([])

    const remove = symbolicLink(src, 'a', dest, 'a')
    expect(src.a).toBe('22')
    src.a = 'aaa'
    expect(src.a).toBe('aaa')

    remove()
    expect(src.a).toBe('fixed')
  })

  it('should symbolicTarget', function() {
    const src = {}
    const dest = {
      a: '22',
      b: 'b'
    }

    const remove = symbolicTarget(src, {
      a: [dest, 'a'],
      b: [dest, 'b'],
      c: [dest, 'a']
    })
    expect(src.a).toBe('22')
    src.a = 'aaa'
    expect(src.a).toBe('aaa')
    expect(src.c).toBe('aaa')

    expect(src.b).toBe('b')
    dest.b = '444'
    expect(src.b).toBe('444')

    remove()
    expect('a' in src).toBeFalsy()
    expect('b' in src).toBeFalsy()
  })
})
