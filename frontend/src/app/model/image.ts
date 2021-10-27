import * as THREE from 'three';
import {Pose} from './pose';

export class Image {
  id: number;
  path: string;
  width: number;
  height: number;
  cameraMatrix: THREE.Matrix3;
  cameraPose: Pose;
  projectionMatrix: THREE.Matrix4;

  constructor(id: number, path: string, width: number, height: number, cameraMatrix: THREE.Matrix3, cameraPose: Pose) {
    this.id = id;
    this.path = path;
    this.width = width;
    this.height = height;
    this.cameraMatrix = cameraMatrix;
    this.cameraPose = cameraPose;
    this.projectionMatrix = new THREE.Matrix4();
    this.updateProjectionMatrix();
  }

  private updateProjectionMatrix(): void {
    const elements = this.cameraMatrix.elements;
    const fx = elements[0];
    const cx = elements[6];
    const fy = elements[4];
    const cy = elements[7];
    const n = 0.01; // z near
    const f = 1000.0; // z far
    const p00 = 2.0 * fx / this.width;
    const p11 = 2.0 * fy / this.height;
    const p02 = 1.0 - 2.0 * cx / this.width;
    const p12 = 2.0 * cy / this.height - 1.0;
    const p32 = -1.0;
    const p22 = (f + n) / (n - f);
    const p23 = (2 * f * n) / (n - f);
    this.projectionMatrix.set(
      p00, 0.0, p02, 0.0,
      0.0, p11, p12, 0.0,
      0.0, 0.0, p22, p23,
      0.0, 0.0, p32, 0.0
    );
  }

}
