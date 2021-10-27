import {Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {CanvasViewerComponent} from '../canvas-viewer/canvas-viewer.component';
import {Image} from '../model/image';
import {Pixel} from '../model/pixel';
import {Correspondence} from '../model/correspondence';

@Component({
  selector: 'app-pixel-picker',
  templateUrl: './pixel-picker.component.html',
  styleUrls: ['./pixel-picker.component.less']
})
export class PixelPickerComponent implements OnInit, OnChanges {

  @ViewChild('img', {static: true}) private imageRef?: ElementRef<HTMLImageElement>;
  @ViewChild(CanvasViewerComponent) canvasViewer?: CanvasViewerComponent;

  @Input() image?: Image;
  @Input() correspondences?: Array<Correspondence>;
  @Input() selectedCorrespondence?: Correspondence;

  constructor() {
  }

  ngOnInit(): void {
    this.refresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.refresh();
  }

  resize(): void {
    this.canvasViewer?.resize();
  }

  refresh(): void {
    this.canvasViewer?.redraw();
  }

  draw(context: CanvasRenderingContext2D): void {
    if (this.image) {
      const imageEl = this.imageRef!!.nativeElement;
      context.drawImage(imageEl, 0, 0, imageEl.width, imageEl.height);
      this.correspondences?.forEach((correspondence) => {
        this.drawMarker(context, correspondence.pixel, 'silver');
      });
      if (this.selectedCorrespondence) {
        this.drawMarker(context, this.selectedCorrespondence.pixel, 'red');
      }
    }
  }

  drawMarker(context: CanvasRenderingContext2D, pixel: Pixel, color: string): void {
    const matrix = context.getTransform();
    const scale = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
    context.beginPath();
    context.beginPath();
    context.arc(pixel.x, pixel.y, 12.0 / scale, 0, 2 * Math.PI, false);
    context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = 2.0 / scale;
    context.stroke();
    context.strokeStyle = color;
    context.beginPath();
    context.lineWidth = 1.0 / scale;
    const offset = 16.0 / scale;
    context.moveTo(pixel.x, pixel.y - offset);
    context.lineTo(pixel.x, pixel.y + offset);
    context.moveTo(pixel.x - offset, pixel.y);
    context.lineTo(pixel.x + offset, pixel.y);
    context.stroke();
  }

  clicked(pixel: Pixel): void {
    if (this.selectedCorrespondence) {
      this.selectedCorrespondence.pixel.x = pixel.x;
      this.selectedCorrespondence.pixel.y = pixel.y;
      this.refresh();
    }
  }
}
