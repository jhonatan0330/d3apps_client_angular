import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ApplicationRef } from '@angular/core';

@Injectable()
export class ErrorHandlerService extends ErrorHandler {
  private errorCount = 0;
  private readonly appRef = inject(ApplicationRef);

  override handleError(error: unknown): void {
    const increment = 5;
    const max = 50;

    this.errorCount++;

    if (this.errorCount % increment === 0) {
      console.log(`errorHandler() was called ${this.errorCount} times.`);
      super.handleError(error);

      if (this.errorCount === max) {
        console.log(
          `Preventing recursive error after ${this.errorCount} recursive errors.`,
        );
        this.appRef.tick();
      }
    } else if (this.errorCount === 1) {
      super.handleError(error);
    }
  }
}
