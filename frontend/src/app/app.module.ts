import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {PoseEditorComponent} from './pose-editor/pose-editor.component';
import {PixelPickerComponent} from './pixel-picker/pixel-picker.component';
import {PointPickerComponent} from './point-picker/point-picker.component';
import {CanvasViewerComponent} from './canvas-viewer/canvas-viewer.component';
import {ImageRenderOverlayComponent} from './image-render-overlay/image-render-overlay.component';
import {FormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MatListModule} from "@angular/material/list";
import {MatIconModule} from "@angular/material/icon";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {MatCommonModule} from "@angular/material/core";
import {MatInputModule} from "@angular/material/input";
import {MatTabsModule} from "@angular/material/tabs";
import {HttpClientModule} from "@angular/common/http";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatSliderModule} from "@angular/material/slider";
import { PoseOffsetComponent } from './pose-offset/pose-offset.component';
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatButtonToggleModule} from "@angular/material/button-toggle";
import {MatRadioModule} from "@angular/material/radio";

@NgModule({
  declarations: [
    AppComponent,
    PoseEditorComponent,
    PixelPickerComponent,
    PointPickerComponent,
    CanvasViewerComponent,
    ImageRenderOverlayComponent,
    PoseOffsetComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCommonModule,
    MatInputModule,
    MatTabsModule,
    HttpClientModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    MatRadioModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
