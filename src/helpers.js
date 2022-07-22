/**
 * @typedef {{ x: number, y: number, z: number }} Point
 * @typedef {{ min: Point, max: Point }} Box
 */

/**
 *
 * @param {Box} box1
 * @param {Box} box2
 * @returns {boolean}
 */
function intersectsBox(box1, box2) {
  // using 6 splitting planes to rule out intersections.
  return box1.max.x < box2.min.x || box1.min.x > box2.max.x ||
  box1.max.y < box2.min.y || box1.min.y > box2.max.y ||
  box1.max.z < box2.min.z || box1.min.z > box2.max.z ? false : true
}

class Vector {
  /**
   *
   * @param {Point} x
   * @param {Point} y
   */
  constructor(x, y) {
    this.x = Math.abs(x.x - y.x)
    this.y = Math.abs(x.y - y.y)
    this.z = Math.abs(x.z - y.z)
  }

  get length() {
    return Math.sqrt(this.x**2 + this.y**2 + this.z**2)
  }
}

class Box {
  constructor(boxArray) {
    this.min = {}
    this.max = {}

    this.min.x = boxArray[0]
    this.min.y = boxArray[1]
    this.min.z = boxArray[2]
    this.max.x = boxArray[3]
    this.max.y = boxArray[4]
    this.max.z = boxArray[5]
  }
}

class Point {
  constructor(array) {
    this.x = array[0]
    this.y = array[1]
    this.z = array[2]
  }
}

module.exports = {
  intersectsBox,
  Vector,
  Box,
  Point,
}