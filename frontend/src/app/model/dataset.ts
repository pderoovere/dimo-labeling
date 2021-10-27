import {Scene} from "./scene";
import {Part} from "./part";

export class Dataset {

  scenes: Array<Scene>;
  parts: Array<Part>;

  constructor(scenes: Array<Scene>, parts: Array<Part>) {
    this.scenes = scenes;
    this.parts = parts;
  }

}
