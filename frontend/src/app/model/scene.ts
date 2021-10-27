import {Image} from './image';
import {PositionedPart} from './positioned-part';

export class Scene {
  id: number;
  images: Array<Image>;
  positionedParts: Array<PositionedPart>;

  constructor(id: number, images: Array<Image>, positionedParts: Array<PositionedPart>) {
    this.id = id;
    this.images = images;
    this.positionedParts = positionedParts;
  }
}
