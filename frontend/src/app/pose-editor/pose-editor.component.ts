import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Pose} from '../model/pose';

@Component({
  selector: 'app-pose-editor',
  templateUrl: './pose-editor.component.html',
  styleUrls: ['./pose-editor.component.less']
})
export class PoseEditorComponent implements OnInit {

  private DELTA = 0.1;

  @Input() location: Pose = new Pose(0, 0, 0, 0, 0, 0);
  @Output() locationChanged = new EventEmitter<Pose>();

  constructor() {
  }

  ngOnInit(): void {
  }

  emitLocationChanged(): void {
    this.locationChanged.emit(this.location);
  }

  clear(): void {
    this.location.x = 0;
    this.location.y = 0;
    this.location.z = 0;
    this.location.w = 0;
    this.location.p = 0;
    this.location.r = 0;
    this.emitLocationChanged();
  }

}
