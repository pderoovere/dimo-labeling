export class Part {
  id: number;
  cadPath: string;
  texturePath?: string;

  constructor(id: number, cadPath: string, texturePath?: string) {
    this.id = id;
    this.cadPath = cadPath;
    this.texturePath = texturePath;
  }
}
