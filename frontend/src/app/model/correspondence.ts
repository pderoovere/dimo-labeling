import {Pixel} from './pixel';
import {Point} from './point';

export class Correspondence {
  pixel: Pixel;
  point: Point;

  constructor(pixel: Pixel, point: Point) {
    this.pixel = pixel;
    this.point = point;
  }

}
