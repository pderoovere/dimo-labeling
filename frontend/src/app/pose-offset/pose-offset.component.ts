import {Component, EventEmitter, HostListener, Input, OnInit, Output} from '@angular/core';
import {Pose} from "../model/pose";

@Component({
  selector: 'app-pose-offset',
  templateUrl: './pose-offset.component.html',
  styleUrls: ['./pose-offset.component.less']
})
export class PoseOffsetComponent implements OnInit {

  @Input() location?: Pose = undefined;
  @Output() locationChanged = new EventEmitter<Pose>();

  offsetXyz: number = 0.1
  offsetWpr: number = 0.05

  constructor() {
  }

  ngOnInit(): void {
  }

  emitLocationChanged(): void {
    this.locationChanged.emit(this.location);
  }

  @HostListener('document:keydown.shift.x')
  moveXNeg() {
    this.move(-this.offsetXyz, 0, 0, 0, 0, 0)
  }

  @HostListener('document:keydown.x')
  moveXPos() {
    this.move(this.offsetXyz, 0, 0, 0, 0, 0)
  }

  @HostListener('document:keydown.shift.y')
  moveYNeg() {
    this.move(0, -this.offsetXyz, 0, 0, 0, 0)
  }

  @HostListener('document:keydown.y')
  moveYPos() {
    this.move(0, this.offsetXyz, 0, 0, 0, 0)
  }

  @HostListener('document:keydown.shift.z')
  moveZNeg() {
    this.move(0, 0, -this.offsetXyz, 0, 0, 0)
  }

  @HostListener('document:keydown.z')
  moveZPos() {
    this.move(0, 0, this.offsetXyz, 0, 0, 0)
  }

  @HostListener('document:keydown.shift.w')
  moveWNeg() {
    this.move(0, 0, 0, -this.offsetWpr, 0, 0)
  }

  @HostListener('document:keydown.w')
  moveWPos() {
    this.move(0, 0, 0, this.offsetWpr, 0, 0)
  }

  @HostListener('document:keydown.shift.p')
  movePNeg() {
    this.move(0, 0, 0, 0, -this.offsetWpr, 0)
  }

  @HostListener('document:keydown.p')
  movePPos() {
    this.move(0, 0, 0, 0, this.offsetWpr, 0)
  }

  @HostListener('document:keydown.shift.r')
  moveRNeg() {
    this.move(0, 0, 0, 0, 0, -this.offsetWpr)
  }

  @HostListener('document:keydown.r')
  moveRPos() {
    this.move(0, 0, 0, 0, 0, this.offsetWpr)
  }

  move(x: number, y: number, z: number, w: number, p: number, r: number): void {
    if (this.location != undefined) {
      const t = new Pose(x, y, z, w, p, r).toMatrix()
      const orig = this.location!!.toMatrix()
      const result = Pose.fromMatrix(orig.multiply(t))
      this.location!!.update(result);
      this.emitLocationChanged();
    }
  }

}
