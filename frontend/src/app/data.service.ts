import {Injectable} from '@angular/core';
import {Scene} from './model/scene';
import {Observable, throwError} from 'rxjs';
import {Part} from './model/part';
import {Image} from './model/image';
import {PositionedPart} from './model/positioned-part';
import {Pose} from './model/pose';
import {Matrix3, Matrix4} from 'three';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, map} from "rxjs/operators";
import {Dataset} from "./model/dataset";
import {Correspondence} from "./model/correspondence";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private readonly url = '/api/';

  constructor(private http: HttpClient) {
  }

  loadDataset(): Observable<Dataset> {
    return this.http.post(this.url + 'load', undefined)
      .pipe(catchError(this.handleError))
      .pipe(map(response => this.deserializeDataset(response)));
  }

  private deserializeDataset(data: any): Dataset {
    const parts = data['parts'].map((part: any) => this.deserializePart(part));
    const scenes = data['scenes'].map((scene: any) => this.deserializeScene(scene, parts));
    return new Dataset(scenes, parts);
  }

  private deserializeScene(data: any, parts: Array<Part>): Scene {
    const id = data['id']
    const images = data['images'].map((image: any) => this.deserializeImage(image));
    const positionedParts = data['positionedParts'].map((positionedPart: any) => this.deserializePositionedPart(positionedPart, parts));
    return new Scene(id, images, positionedParts)
  }

  private deserializeImage(data: any): Image {
    const id = data['id'];
    const path = data['path'];
    const width = data['width'];
    const height = data['height'];
    const cameraMatrix = new Matrix3().fromArray(data['cameraMatrix']);
    // Rotate camera 180deg around x axis, to switch from bop/opencv convention to opengl/threejs convention
    const cameraPose = Pose.fromRefToWorld(new Pose(0, 0, 0, 180, 0, 0), this.deserializePose(data['cameraPose']));
    return new Image(id, path, width, height, cameraMatrix, cameraPose);
  }

  private deserializePose(data: any): Pose {
    const T = new Matrix4().fromArray(data);
    return Pose.fromMatrix(T);
  }

  private deserializePart(data: any): Part {
    const id = data['id']
    const cadPath = data['cadPath']
    const texturePath = data['texturePath']
    return new Part(id, cadPath, texturePath);
  }

  private deserializePositionedPart(data: any, parts: Array<Part>): PositionedPart {
    const pose = this.deserializePose(data['pose']);
    const part = parts.find((part) => part.id == data['part']['id'])!!;
    //const part = this.deserializePart(data['part']);
    return new PositionedPart(pose, part);
  }

  save(scenes: Array<Scene>): void {
    this.http.post(this.url + 'save', scenes.map((scene) => this.serializeScene(scene)))
      .pipe(catchError(this.handleError)).subscribe((data) => {
    });
  }

  private serializeScene(scene: Scene): {} {
    return {
      id: scene.id,
      images: scene.images.map((image) => this.serializeImage(image)),
      positionedParts: scene.positionedParts.map((positionedPart) => this.serializePositionedPart(positionedPart))
    }
  }

  private serializeImage(image: Image): {} {
    const pose = Pose.fromRefToWorld(new Pose(0, 0, 0, -180, 0, 0), image.cameraPose)
    return {
      id: image.id,
      path: image.path,
      width: image.width,
      height: image.height,
      cameraMatrix: image.cameraMatrix.toArray(),
      cameraPose: pose.toMatrix().toArray()
    }
  }

  private serializePose(pose: Pose): any {
    return pose.toMatrix().toArray();
  }

  private serializePart(part: Part): {} {
    return {
      id: part.id,
      cadPath: part.cadPath,
      texturePath: part.texturePath
    }
  }

  private serializePositionedPart(positionedPart: PositionedPart): {} {
    return {
      pose: this.serializePose(positionedPart.pose),
      part: this.serializePart(positionedPart.part)
    }
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
    }
    return throwError('Something bad happened; please try again later.');
  }

  calculatePose(correspondences: Array<Correspondence>, image: Image): Observable<Pose> {
    const points = correspondences.map((correspondence) => {
      const point = correspondence.point
      return [point.x, point.y, point.z]
    })
    const pixels = correspondences.map((correpondence) => {
      const pixel = correpondence.pixel
      return [pixel.x, pixel.y]
    })
    const cameraMatrix = image.cameraMatrix.toArray()
    const data = {
      points: points,
      pixels: pixels,
      cameraMatrix: cameraMatrix
    };
    return this.http.post(this.url + 'pose', data)
      .pipe(catchError(this.handleError))
      .pipe(map(response => this.deserializePose(response)));
  }

}
