import {
  Component,
  ElementRef,
  HostListener,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as THREE from 'three';
import { TextureLoader, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { Correspondence } from '../model/correspondence';
import { Part } from '../model/part';


@Component({
  selector: 'app-point-picker',
  templateUrl: './point-picker.component.html',
  styleUrls: ['./point-picker.component.less']
})
export class PointPickerComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild('container', { static: true }) private container?: ElementRef<HTMLCanvasElement>;
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private controls?: OrbitControls;
  private mouse: THREE.Vector2 = new THREE.Vector2();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();

  private intersection?: THREE.Vector3;

  private frameId?: number;

  private textureLoader: TextureLoader = new TextureLoader();
  private plyLoader: PLYLoader = new PLYLoader();
  private mesh?: THREE.Mesh;
  private points?: THREE.Points;
  private activePoint?: THREE.Points;
  private dragged?: boolean;

  snap: boolean = true;

  @Input() part?: Part;
  @Input() correspondences?: Array<Correspondence>;
  @Input() selectedCorrespondence?: Correspondence;

  constructor(private ngZone: NgZone) {
    this.plyLoader.setPropertyNameMapping({
      texture_u: 's',
      texture_v: 't'
    });
    this.textureLoader.crossOrigin = '';
  }

  @HostListener('document:keydown.t')
  toggleSnap() {
    this.snap = !this.snap;
  }

  ngOnInit(): void {
    this.initThreeD();
    this.start();
    this.inputsChanged();
    setTimeout(() => this.resize()); // Resize after page has rendered
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.inputsChanged();
  }

  inputsChanged(): void {
    this.refreshMesh();
    this.refreshPoints();
  }

  private getTop(): number {
    return this.container!!.nativeElement.getBoundingClientRect().top;
  }

  private getLeft(): number {
    return this.container!!.nativeElement.getBoundingClientRect().left;
  }

  private getBottom(): number {
    return this.container!!.nativeElement.getBoundingClientRect().bottom;
  }

  private getRight(): number {
    return this.container!!.nativeElement.getBoundingClientRect().right;
  }

  private getWidth(): number {
    return this.container!!.nativeElement.clientWidth;
  }

  private getHeight(): number {
    return this.container!!.nativeElement.clientHeight;
  }

  private initThreeD(): void {
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.container!!.nativeElement.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.setupCamera();
    this.setupLights();
    this.setupAxes();
    this.refreshPoints();
    this.setupRaycaster();
  }

  private setupCamera(): void {
    this.camera = new THREE.PerspectiveCamera(75, this.getWidth() / this.getHeight(), 0.1, 5_000);
    this.camera.position.y = 500;
    this.camera.up.set(0, 0, 1);
    this.scene!!.add(this.camera);
    this.controls = new OrbitControls(this.camera, this.renderer!!.domElement);
  }

  private setupLights(): void {
    // ambient
    const ambient = new THREE.AmbientLight(0xffffff);
    this.scene!!.add(ambient);
    // directional 2
    const directional = new THREE.DirectionalLight(0xffffff);
    directional.position.set(0, 10, 0).normalize();
    this.camera!!.add(directional);
  }

  private setupAxes(): void {
    const axesHelper = new THREE.AxesHelper(1000);
    this.scene!!.add(axesHelper);
  }

  refreshMesh(): void {
    this.removeMesh();
    if (this.part) {
      const cadPath = this.part.cadPath;
      this.plyLoader.load(cadPath, (geometry => {
        if (cadPath == this.part?.cadPath) {
          geometry.computeVertexNormals();
          if (this.part.texturePath) {
            const texturePath = this.part.texturePath
            this.textureLoader.load(this.part!!.texturePath, (texture => {
              if (texturePath == this.part?.texturePath) {
                const material = new THREE.MeshStandardMaterial({
                  map: texture,
                  metalness: 0.25
                });
                this.addMesh(geometry, material);
              }
            }));
          } else {
            const material = new THREE.MeshPhongMaterial({
              //color: 0x007Aff,
              vertexColors: true,
              shininess: 30,
              flatShading: true,
              transparent: true,
            });
            this.addMesh(geometry, material);
          }
        }
      }));
    }
  }

  addMesh(geometry: THREE.BufferGeometry, material: THREE.Material): void {
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene!!.add(this.mesh);
  }

  removeMesh(): void {
    if (this.mesh) {
      this.scene!!.remove(this.mesh);
      this.mesh.geometry.dispose();
      (this.mesh.material as any).dispose();
    }
  }

  private refreshPoints(): void {
    if (this.scene) {
      this.removePoints();
      if (this.correspondences) {
        this.points = this.createPoints(this.correspondences, '/assets/sprites/marker_gray.png');
        this.scene!!.add(this.points);
      }
      if (this.selectedCorrespondence) {
        this.activePoint = this.createPoints([this.selectedCorrespondence], '/assets/sprites/marker.png');
        this.scene!!.add(this.activePoint);
      }
    }
  }

  private removePoints(): void {
    if (this.points) {
      this.scene!!.remove(this.points);
      this.points.geometry.dispose();
      (this.points.material as any).dispose();
    }
    if (this.activePoint) {
      this.scene!!.remove(this.activePoint);
      this.activePoint.geometry.dispose();
      (this.activePoint.material as any).dispose();
    }
  }

  private createPoints(correspondences: Array<Correspondence>, spritePath: string): THREE.Points {
    const vertices: Array<number> = [];
    correspondences.forEach((c) => {
      const p = c.point;
      vertices.push(p.x, p.y, p.z);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const sprite = new THREE.TextureLoader().load(spritePath);
    const material = new THREE.PointsMaterial({
      size: 32, sizeAttenuation: false, map: sprite, transparent: true, alphaTest: 0
    });
    return new THREE.Points(geometry, material);
  }

  private setupRaycaster(): void {
    this.raycaster!!.params.Points!!.threshold = 1;
  }

  private updateRaycaster(): void {
    if (this.mesh == null) {
      return;
    }
    this.raycaster.setFromCamera(this.mouse, this.camera!!);
    const meshIntersections = this.raycaster.intersectObject(this.mesh);
    this.intersection = this.findIntersectionPoint(meshIntersections);
    if (this.intersection) {
      this.container!!.nativeElement.style.cursor = 'crosshair';
    } else {
      this.container!!.nativeElement.style.cursor = 'auto';
    }
  }

  private findIntersectionPoint(meshIntersections: THREE.Intersection[]): Vector3 | undefined {
    if (meshIntersections.length > 0) {
      const intersection = meshIntersections[0];

      let vertex = intersection.point;
      if (this.snap) {
        const vertexA = new THREE.Vector3();
        const vertexB = new THREE.Vector3();
        const vertexC = new THREE.Vector3();
        vertexA.fromBufferAttribute(this.mesh!!.geometry.getAttribute('position'), intersection!!.face!!.a);
        vertexB.fromBufferAttribute(this.mesh!!.geometry.getAttribute('position'), intersection!!.face!!.b);
        vertexC.fromBufferAttribute(this.mesh!!.geometry.getAttribute('position'), intersection!!.face!!.c);
        const distanceA = vertex.distanceTo(vertexA);
        const distanceB = vertex.distanceTo(vertexB);
        const distanceC = vertex.distanceTo(vertexC);
        if (distanceA < distanceB && distanceA < distanceB) {
          vertex = vertexA;
        } else if (distanceB < distanceC) {
          vertex = vertexB;
        } else {
          vertex = vertexC;
        }
      }
      return vertex?.applyMatrix4(intersection.object.matrixWorld);
    }
    return undefined;
  }

  private start(): void {
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this.render();
        }
        );
      }
      const canvas = this.container!!.nativeElement;
      window.addEventListener('resize', () => {
        this.resize();
      });
      canvas.addEventListener('pointermove', (event) => {
        this.updateLastMouse(event);
        this.dragged = true;
      }, false);
      canvas.addEventListener('pointerdown', (event) => {
        this.updateLastMouse(event);
        this.dragged = false;
      }, false);
      canvas.addEventListener('pointerup', (event) => {
        if (!this.dragged && this.intersection) {
          this.selectedCorrespondence!!.point.x = this.intersection.x;
          this.selectedCorrespondence!!.point.y = this.intersection.y;
          this.selectedCorrespondence!!.point.z = this.intersection.z;
          this.refreshPoints();
        }
      }, false);
    });
  }

  private updateLastMouse(event: MouseEvent): void {
    this.mouse.x = ((event.clientX - this.getLeft()) / (this.getRight() - this.getLeft())) * 2 - 1;
    this.mouse.y = -((event.clientY - this.getTop()) / (this.getBottom() - this.getTop())) * 2 + 1;
  }

  private render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });
    this.renderer!!.render(this.scene!!, this.camera!!);
    this.controls!!.update();
    this.updateRaycaster();
  }

  resize(): void {
    this.camera!!.aspect = this.getWidth() / this.getHeight();
    this.camera!!.updateProjectionMatrix();
    this.renderer!!.setSize(this.getWidth(), this.getHeight());
  }

  ngOnDestroy(): void {
    this.stop();
    this.removeMesh();
    this.renderer?.dispose();
  }

  private stop(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

}
