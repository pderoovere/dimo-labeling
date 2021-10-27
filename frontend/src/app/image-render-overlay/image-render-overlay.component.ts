import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Image} from '../model/image';
import * as THREE from 'three';
import {TextureLoader} from 'three';
import {PLYLoader} from 'three/examples/jsm/loaders/PLYLoader';
import {Pose} from '../model/pose';
import * as panzoom from "panzoom";
import {TransformControls} from 'three/examples/jsm/controls/TransformControls.js';
import {Part} from "../model/part";
import {PositionedPart} from "../model/positioned-part";

@Component({
  selector: 'app-image-render-overlay',
  templateUrl: './image-render-overlay.component.html',
  styleUrls: ['./image-render-overlay.component.less']
})
export class ImageRenderOverlayComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild('rendererCanvas', {static: true}) private rendererCanvasRef?: ElementRef<HTMLCanvasElement>;

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private controls?: TransformControls;
  private textureLoader: TextureLoader = new TextureLoader();
  private plyLoader: PLYLoader = new PLYLoader();
  private mesh?: THREE.Mesh;
  private partsMeshes: Array<THREE.Mesh> = [];

  @Input() positionedParts?: Array<PositionedPart>;
  @Input() selectedPositionedPart?: PositionedPart;
  @Input() part?: Part;
  @Input() image?: Image;
  @Input() pose?: Pose;

  selectedPartOpacity: number = 0.5;
  otherPartsOpacity: number = 0.25;
  overrideColor: boolean = false;
  translateControls: boolean = true;

  selectedColor = 0x007aff;
  colors = [
    0x34c759, 0xff9500, 0xaf52de, 0x00c7be, 0xa2845e, 0xff2d55,
    0x2d42ff, 0xFF2DEA, 0xEAFF2D, 0xFF572D, 0x2DFF9DFF, 0x2DFFDF, 0xffcc00,
  ];

  @Output() poseChange: EventEmitter<Pose> = new EventEmitter<Pose>();

  constructor() {
    this.plyLoader.setPropertyNameMapping({
      texture_u: 's',
      texture_v: 't'
    });
    this.textureLoader.crossOrigin = '';
  }

  ngOnInit(): void {
    this.initThreeD();
    // @ts-ignore
    panzoom(this.rendererCanvasRef?.nativeElement, {
      // @ts-ignore
      beforeMouseDown: (e) => {
        return this.controls!!.dragging;
      }
    });
  }

  initThreeD(): void {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.rendererCanvasRef!!.nativeElement,
      alpha: true,
      antialias: true
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 5_000);
    this.scene.add(this.camera);
    this.scene.add(new THREE.AmbientLight(0xffffff));
    const directionalLight = new THREE.DirectionalLight(0xffffff);
    this.scene.add(directionalLight);
    const cameraLight = new THREE.PointLight(0xffffff);
    cameraLight.position.set(1, 1, 0);
    this.camera.add(cameraLight);
    this.setupTransformControls();
  }

  private setupTransformControls(): void {
    this.controls = new TransformControls(this.camera!!, this.renderer?.domElement);
    this.controls.setSpace('local');
    this.controls.setSize(1);
    this.controls.setRotationSnap(0.05);
    this.controls.setTranslationSnap(0.1);
    this.controls.addEventListener('change', (event) => {
      this.render();
    });
    this.controls.addEventListener('mouseUp', (event) => {
      if (this.mesh) {
        const newPose = Pose.fromMatrix(this.mesh!!.matrixWorld);
        this.poseChange.emit(newPose);
      }
    });
    this.scene!!.add(this.controls);
  }

  @HostListener('document:keydown.t')
  translationControls() {
    this.controls!!.setMode("translate");
  }

  @HostListener('document:keydown.o')
  orientationsControls() {
    this.controls!!.setMode("rotate");
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.image) {
      this.refreshImage();
    }
    if (changes.pose) {
      this.refreshPose();
    }
    if (changes.part) {
      this.refreshMesh();
    }
    if (changes.selectedPositionedPart || changes.positionedParts) {
      this.refreshPositionedParts();
    }
  }

  refreshMesh(): void {
    if (this.mesh) {
      this.controls?.remove(this.mesh);
      this.controls?.detach();
      this.removeMesh(this.mesh);
    }
    if (this.part) {
      const cadPath = this.part.cadPath;
      this.loadPart(this.part, (mesh => {
        if (cadPath == this.part?.cadPath) {
          this.addMesh(mesh);
        }
      }), this.selectedColor, this.selectedPartOpacity);
    }
  }

  private addMesh(mesh: THREE.Mesh): void {
    this.removeMesh(this.mesh); // Just to be sure
    this.mesh = mesh;
    this.scene!!.add(this.mesh);
    this.controls?.attach(this.mesh);
    this.refreshPose();
  }

  refreshPose() {
    if (this.mesh && this.pose) {
      this.setPose(this.mesh, this.pose)
      this.render();
    }
  }

  private setPose(mesh: THREE.Mesh, pose: Pose): void {
    mesh.rotation.setFromRotationMatrix(pose.toMatrix());
    mesh.position.setFromMatrixPosition(pose.toMatrix());
  }

  refreshImage() {
    if (this.image) {
      this.rendererCanvasRef!!.nativeElement.width = this.image.width;
      this.rendererCanvasRef!!.nativeElement.height = this.image.height;
      this.renderer!!.setSize(this.image.width, this.image.height);
      this.camera!!.projectionMatrix = this.image.projectionMatrix;
      this.camera!!.projectionMatrixInverse = this.image.projectionMatrix.clone().invert();
      const cameraPoseMatrix = this.image?.cameraPose.toMatrix();
      this.camera!!.position.setFromMatrixPosition(cameraPoseMatrix);
      this.camera!!.rotation.setFromRotationMatrix(cameraPoseMatrix);
      this.camera!!.updateMatrixWorld();
      const imagePath = this.image.path;
      this.textureLoader.load(imagePath, (texture) => {
        texture.minFilter = THREE.LinearFilter;
        if (imagePath == this.image?.path) { // Only update if the path is still valid
          this.scene!!.background = texture;
          this.render();
        }
      });
    }
  }

  refreshPositionedParts(): void {
    this.removeParts();
    this.positionedParts?.forEach(((positionedPart, i) => {
      if (positionedPart != this.selectedPositionedPart) {
        const cadPath = positionedPart?.part?.cadPath
        this.loadPart(positionedPart.part, mesh => {
            if (cadPath == this.positionedParts!![i].part.cadPath) {
              this.scene?.add(mesh);
              this.setPose(mesh, positionedPart.pose);
              this.partsMeshes.push(mesh);
              this.render();
            }
          }, this.colors[i], this.otherPartsOpacity
        );
      }
    }));
  }

  refreshAllParts(): void {
    this.refreshMesh();
    this.refreshPositionedParts();
  }

  private static randomColor(): number {
    return Math.random() * 0xffffff
  }

  private loadPart(part: Part, onload: (mesh: THREE.Mesh) => void, defaultColor: number, opacity: number): void {
    this.plyLoader.load(part.cadPath, (geometry => {
      geometry.computeVertexNormals();
      if (this.part!!.texturePath) {
        this.textureLoader.load(this.part!!.texturePath, (texture => {
          const material = this.createTextureMaterial(texture, defaultColor, opacity);
          const mesh = new THREE.Mesh(geometry, material);
          onload(mesh);
        }));
      } else {
        const material = this.createPhongMaterial(defaultColor, opacity)
        onload(new THREE.Mesh(geometry, material));
      }
    }));
  }

  private createTextureMaterial(texture: THREE.Texture, defaultColor: number, opacity: number): THREE.Material {
    if (this.overrideColor) {
      return this.createPhongMaterial(defaultColor, opacity);
    } else {
      return new THREE.MeshStandardMaterial({
        map: texture,
        opacity: opacity,
        metalness: 0.25,
        transparent: true,
      });
    }
  }

  private createPhongMaterial(defaultColor: number, opacity: number): THREE.Material {
    const vertexColors = !this.overrideColor;
    const color = this.overrideColor ? defaultColor : undefined;
    return new THREE.MeshPhongMaterial({
      color: color,
      vertexColors: vertexColors,
      shininess: 30,
      flatShading: true,
      transparent: true,
      opacity: opacity
    });
  }

  private removeParts(): void {
    this.partsMeshes.forEach(mesh => {
      this.removeMesh(mesh);
    })
    this.partsMeshes = [];
  }

  private removeMesh(mesh?: THREE.Mesh): void {
    if (mesh) {
      this.scene!!.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as any).dispose();
    }
  }

  private render(): void {
    this.renderer?.render(this.scene!!, this.camera!!);
  }

  ngOnDestroy(): void {
    this.renderer!!.dispose();
    this.removeMesh();
  }

}
