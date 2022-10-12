import { Directive, Output, Input, EventEmitter, HostBinding, HostListener, NgModule } from '@angular/core';

@Directive({
  selector: '[appDragAndDrop]',
})
export class DragAndDropDirective {
  @HostBinding('class.fileover') fileOver: boolean;
  @Output() fileDropped = new EventEmitter<any>();

  // Dragover listener
  @HostListener('dragover', ['$event']) onDragOver(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.fileOver = true;
  }

  // Dragleave listener
  @HostListener('dragleave', ['$event']) public onDragLeave(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.fileOver = false;
  }

  // Drop listener
  @HostListener('drop', ['$event']) public ondrop(ev: DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.fileOver = false;
    const files = ev.dataTransfer.files;
    if (files.length > 0) {
      this.fileDropped.emit(files);
    }
  }
}

@NgModule({
  declarations: [DragAndDropDirective],
  exports: [DragAndDropDirective],
  providers: [],
})
export class DragAndDropDirectiveModule {}
