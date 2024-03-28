import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {Pixel} from '../model/pixel';

@Component({
  selector: 'app-canvas-viewer',
  templateUrl: './canvas-viewer.component.html',
  styleUrls: ['./canvas-viewer.component.less']
})
export class CanvasViewerComponent implements OnInit, AfterViewInit {

  @Output() readonly clicked = new EventEmitter<Pixel>();
  @Output() readonly draw = new EventEmitter<CanvasRenderingContext2D>();

  @ViewChild('canvas', {static: true}) private canvasRef?: ElementRef<HTMLCanvasElement>;
  private canvas?: HTMLCanvasElement;
  private context?: CanvasRenderingContext2D;
  private lastMouse?: DOMPoint;
  private dragStart?: DOMPoint;
  private dragged?: boolean;

  constructor() {
  }

  ngOnInit(): void {
    this.canvas = this.canvasRef!!.nativeElement;
    this.context = this.canvas.getContext('2d')!!;
    this.setupCanvasListeners(this.canvas, this.context);
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.resize();
  }

  ngAfterViewInit(): void {
    this.resize();
  }

  resize(): void {
    if (!this.canvas) {
      return;
    }
    this.canvas!!.width = this.canvas!!.getBoundingClientRect().width;
    this.canvas!!.height = this.canvas!!.getBoundingClientRect().height;
    this.redraw();
  }

  redraw(): void {
    this.clear(this.context!!);
    this.draw.emit(this.context);
  }

  private clear(context: CanvasRenderingContext2D): void {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, this.canvas!!.width, this.canvas!!.height);
    context.restore();
  }

  private setupCanvasListeners(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
    // mouse down
    canvas.addEventListener('mousedown', (event) => {
      document.body.style.userSelect = 'none';
      this.updateLastMouse(event, canvas);
      this.dragStart = this.transformedPoint(context, this.lastMouse!!);
      this.dragged = false;
    }, false);
    // mouse move
    canvas.addEventListener('mousemove', (event) => {
      this.updateLastMouse(event, canvas);
      this.dragged = true;
      if (this.dragStart) {
        const p = this.transformedPoint(context, this.lastMouse!!);
        context.translate(p.x - this.dragStart.x, p.y - this.dragStart.y);
        this.redraw();
      }
    }, false);
    // mouse up
    canvas.addEventListener('mouseup', (event) => {
      this.updateLastMouse(event, canvas);
      this.dragStart = undefined;
      if (!this.dragged) {
        const clickLocation = this.transformedPoint(context, this.lastMouse!!);
        this.clicked.emit(new Pixel(clickLocation.x, clickLocation.y));
        this.redraw();
      }
    }, false);
    // scroll
    const onScroll = (event: any) => {
      const delta = event.wheelDelta ? event.wheelDelta / 40 : event.detail ? -event.detail : 0;
      if (delta) {
        this.zoom(context, delta);
      }
      return event.preventDefault() && false;
    };
    canvas.addEventListener('DOMMouseScroll', onScroll, false);
    canvas.addEventListener('mousewheel', onScroll, false);
  }

  private zoom(context: CanvasRenderingContext2D, clicks: number): void {
    const p = this.transformedPoint(context, this.lastMouse!!);
    context.translate(p.x, p.y);
    const factor = Math.pow(1.1, clicks);
    context.scale(factor, factor);
    context.translate(-p.x, -p.y);
    this.redraw();
  }

  private updateLastMouse(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const lastX = event.offsetX || (event.pageX - canvas.offsetLeft);
    const lastY = event.offsetY || (event.pageY - canvas.offsetTop);
    this.lastMouse = this.createPoint(lastX, lastY);
  }

  private createPoint(x: number, y: number): DOMPoint {
    // const point = this.svg.createSVGPoint();
    const point = new DOMPoint(x, y);
    point.x = x;
    point.y = y;
    return point;
  }

  private transformedPoint(context: CanvasRenderingContext2D, p: SVGPoint): DOMPoint {
    return context.getTransform().inverse().transformPoint(p);
  }

}
