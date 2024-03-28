import {Component, HostListener, ViewChild} from '@angular/core';
import {DataService} from './data.service';
import {Scene} from './model/scene';
import {Part} from './model/part';
import {PositionedPart} from './model/positioned-part';
import {Pose} from './model/pose';
import {Image} from './model/image';
import {ImageRenderOverlayComponent} from './image-render-overlay/image-render-overlay.component';
import {Pixel} from './model/pixel';
import {PixelPickerComponent} from './pixel-picker/pixel-picker.component';
import {PointPickerComponent} from './point-picker/point-picker.component';
import {Correspondence} from './model/correspondence';
import {Point} from "./model/point";
import {MatTabGroup} from "@angular/material/tabs";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {

  @ViewChild(ImageRenderOverlayComponent) imageRenderOverlay?: ImageRenderOverlayComponent;
  @ViewChild(PixelPickerComponent) pixelPicker?: PixelPickerComponent;
  @ViewChild(PointPickerComponent) pointPicker?: PointPickerComponent;
  @ViewChild(MatTabGroup) tabGroup?: MatTabGroup;

  parts: Array<Part> = [];
  scenes: Array<Scene> = [];
  correspondences: Array<Correspondence> = [];

  selectedScene?: Scene;
  selectedPositionedPart?: PositionedPart;
  absolutePose: Pose = new Pose(0, 0, 0, 0, 0, 0);
  relativePose: Pose = new Pose(0, 0, 0, 0, 0, 0);
  selectedImage?: Image;
  selectedCorrespondence?: Correspondence;

  constructor(private dataService: DataService) {
    this.refreshData();
  }

  private refreshData(): void {
    const path = '';
    this.dataService.loadDataset().subscribe(
      (dataset) => {
        this.parts = dataset.parts;
        this.scenes = dataset.scenes;
        this.selectFirstScene()
      }
    )
  }

  private selectFirstScene(): void {
    if (this.scenes.length > 0) {
      this.selectScene(this.scenes[0]);
    } else {
      this.selectScene(undefined);
    }
  }

  selectScene(scene?: Scene): void {
    this.selectedScene = scene;
    this.selectFirstPart();
    this.selectFirstImage();
  }

  private selectFirstPart(): void {
    if (this.selectedScene!!.positionedParts.length > 0) {
      this.selectPositionedPart(this.selectedScene!!.positionedParts[0]);
    } else {
      this.selectPositionedPart(undefined);
    }
  }

  private selectLastPart(): void {
    if (this.selectedScene!!.positionedParts.length > 0) {
      this.selectPositionedPart(this.selectedScene!!.positionedParts[this.selectedScene!!.positionedParts.length - 1]);
    } else {
      this.selectPositionedPart(undefined);
    }
  }

  selectPositionedPart(positionedPart?: PositionedPart): void {
    this.selectedPositionedPart = positionedPart;
    this.absolutePose = positionedPart?.pose ?? new Pose(0, 0, 0, 0, 0, 0);
    this.recalculateRelativePose();
    this.correspondences.splice(0, this.correspondences.length);
  }

  @HostListener('document:keydown.d')
  copySelectedPart(): void {
    this.selectedScene!!.positionedParts.push({
      pose: this.selectedPositionedPart?.pose.clone(),
      part: this.selectedPositionedPart?.part
    } as PositionedPart);
    this.selectLastPart();
  }

  @HostListener('document:keydown.n')
  addNewLocatedPart(): void {
    this.selectedScene!!.positionedParts.push({
      pose: new Pose(0, 0, 0, 0, 0, 0),
      part: this.selectedPositionedPart?.part ?? this.parts[0]
    } as PositionedPart);
    this.selectLastPart();
  }

  removeLocatedPart(locatedPart: PositionedPart): void {
    this.selectedScene!!.positionedParts.splice(this.selectedScene!!.positionedParts.indexOf(locatedPart), 1);
    this.selectLastPart();
  }

  selectPart(part: Part): void {
    this.selectedPositionedPart!!.part = part;
    this.imageRenderOverlay?.refreshMesh();
    this.correspondences.splice(0, this.correspondences.length);
  }

  private selectFirstImage(): void {
    this.selectImage(this.selectedScene!!.images[0]); // We assume there is always at least one image in each scene.
  }

  selectImage(image: Image): void {
    this.selectedImage = image;
    this.recalculateRelativePose();
    this.imageRenderOverlay?.refreshImage();
    this.correspondences.splice(0, this.correspondences.length);
  }

  recalculateRelativePose(): void {
    this.selectedPositionedPart?.pose?.update(this.absolutePose);
    if (this.selectedImage) {
      const cameraPose = this.selectedImage!!.cameraPose;
      if (cameraPose != undefined && this.absolutePose != undefined) {
        this.relativePose = Pose.fromWorldToRef(this.absolutePose, cameraPose);
      } else {
        this.relativePose = new Pose(0, 0, 0, 0, 0, 0);
      }
      this.poseChanged();
    }
  }

  recalculateAbsolutePose(): void {
    const relativePose = this.relativePose;
    const cameraPose = this.selectedImage!!.cameraPose;
    this.absolutePose!!.update(Pose.fromRefToWorld(relativePose!!, cameraPose));
    this.selectedPositionedPart?.pose.update(this.absolutePose);
    this.poseChanged();
  }

  absolutePoseChanged(pose: Pose): void {
    this.absolutePose.update(pose);
    this.recalculateRelativePose();
  }

  poseChanged(): void {
    this.imageRenderOverlay?.refreshPose();
  }

  @HostListener('document:keydown.c')
  addNewCorrespondence(): void {
    this.correspondences.push(new Correspondence(new Pixel(0, 0), new Point(0, 0, 0)));
    this.selectLastCorrespondence();
  }

  removeCorrespondence(correspondence: Correspondence): void {
    this.correspondences.splice(this.correspondences.indexOf(correspondence), 1);
    this.selectLastCorrespondence();
  }

  selectCorrespondence(correspondence: Correspondence): void {
    this.selectedCorrespondence = correspondence;
  }

  selectLastCorrespondence(): void {
    if (this.correspondences.length > 0) {
      this.selectedCorrespondence = this.correspondences[this.correspondences.length - 1];
    } else {
      this.selectedCorrespondence = undefined;
    }
  }

  @HostListener('document:keydown.a')
  showOverlay(): void {
    this.tabGroup!!.selectedIndex = 0;
  }

  @HostListener('document:keydown.b')
  showCorrespondences(): void {
    this.tabGroup!!.selectedIndex = 1;
  }

  switchedTabs(): void {
    if (this.pixelPicker == undefined || this.pointPicker == undefined) {
      return;
    }
    this.pixelPicker!!.resize();
    this.pointPicker!!.resize();
  }

  load(): void {
    this.refreshData();
  }

  @HostListener('document:keydown.s')
  save(): void {
    this.dataService.save(this.scenes);
  }

  @HostListener('document:keydown.h')
  prevImage(): void {
    if (this.selectedImage != undefined) {
      const images = this.selectedScene!!.images;
      const curIdx = images.indexOf(this.selectedImage)!!;
      const imgToShow = (curIdx - 1 + images.length) % (images.length);
      this.showImage(imgToShow);
    }
  }

  @HostListener('document:keydown.j')
  nextImage(): void {
    if (this.selectedImage != undefined) {
      const images = this.selectedScene!!.images;
      const curIdx = images.indexOf(this.selectedImage)!!;
      const imgToShow = (curIdx + 1) % images.length;
      this.showImage(imgToShow);
    }
  }

  @HostListener('document:keydown.enter')
  calculatePoseFromCorrespondences() {
    this.dataService.calculatePose(this.correspondences, this.selectedImage!!).subscribe((pose) => {
      this.relativePose.update(pose);
      this.recalculateAbsolutePose();
      this.showOverlay();
    })
  }


  @HostListener('document:keydown.shift.1')
  showImage1(): void {
    this.showImage(0)
  }

  @HostListener('document:keydown.shift.2')
  showImage2(): void {
    this.showImage(1)
  }

  @HostListener('document:keydown.shift.3')
  showImage3(): void {
    this.showImage(2)
  }

  @HostListener('document:keydown.shift.4')
  showImage4(): void {
    this.showImage(3)
  }

  @HostListener('document:keydown.shift.5')
  showImage5(): void {
    this.showImage(4)
  }

  @HostListener('document:keydown.shift.6')
  showImage6(): void {
    this.showImage(5)
  }

  @HostListener('document:keydown.shift.7')
  showImage7(): void {
    this.showImage(6)
  }

  @HostListener('document:keydown.shift.8')
  showImage8(): void {
    this.showImage(7)
  }

  @HostListener('document:keydown.shift.9')
  showImage9(): void {
    this.showImage(8)
  }

  showImage(index: number): void {
    if (this.selectedScene?.images.length ?? 0 > index) {
      this.selectImage(this.selectedScene!!.images[index]);
    }
  }

}
