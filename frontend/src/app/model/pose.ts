import {Euler, MathUtils, Matrix4, Vector3} from 'three';
import degToRad = MathUtils.degToRad;
import radToDeg = MathUtils.radToDeg;

export class Pose {
  x: number;
  y: number;
  z: number;
  w: number;
  p: number;
  r: number;

  constructor(x: number, y: number, z: number, w: number, p: number, r: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    this.p = p;
    this.r = r;
  }

  static fromMatrix(m: Matrix4): Pose {
    const translation = new Vector3();
    translation.setFromMatrixPosition(m);
    const rotation = new Euler();
    rotation.setFromRotationMatrix(m);
    return new Pose(translation.x, translation.y, translation.z, radToDeg(rotation.x), radToDeg(rotation.y), radToDeg(rotation.z));
  }

  static fromRefToWorld(p2Ref: Pose, ref2World: Pose): Pose {
    return this.fromMatrix(ref2World.toMatrix().multiply(p2Ref.toMatrix()));
  }

  static fromWorldToRef(p2World: Pose, ref2World: Pose): Pose {
    return this.fromMatrix(ref2World.toMatrix().invert().multiply(p2World.toMatrix()));
  }

  toMatrix(): Matrix4 {
    let result = new Matrix4();
    result = result.makeRotationFromEuler(new Euler(degToRad(this.w), degToRad(this.p), degToRad(this.r)));
    result = result.setPosition(this.x, this.y, this.z);
    return result;
  }

  update(p: Pose): void {
    this.x = p.x;
    this.y = p.y;
    this.z = p.z;
    this.w = p.w;
    this.p = p.p;
    this.r = p.r;
  }

  clone(): Pose {
    return new Pose(this.x, this.y, this.z, this.w, this.p, this.r);
  }

}
