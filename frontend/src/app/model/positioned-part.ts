import {Part} from './part';
import {Pose} from './pose';

export class PositionedPart {
  pose: Pose;
  part: Part;

  constructor(pose: Pose, part: Part) {
    this.pose = pose;
    this.part = part;
  }
}
