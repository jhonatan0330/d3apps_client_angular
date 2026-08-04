import { MediaMatcher } from '@angular/cdk/layout';
import {
  DestroyRef,
  inject,
  Injectable,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';

type MediaQueryObserver = {
  matches: WritableSignal<boolean>;
  handler: (event: MediaQueryListEvent) => void;
};

@Injectable({ providedIn: 'root' })
export class Media {
  // Dependencies
  private destroyRef = inject(DestroyRef);
  private mediaMatcher = inject(MediaMatcher);

  // State
  private matchers = new Map<string, MediaQueryObserver>();

  /**
   * Creates a new media query observer signal for the given query.
   */
  match(query: string): Signal<boolean> {
    const existingMatcher = this.matchers.get(query);
    if (existingMatcher) {
      return existingMatcher.matches.asReadonly();
    }

    // Create MediaQueryList for the query
    const mql = this.mediaMatcher.matchMedia(query);

    // Create new signal with initial matches value of the mql
    const matches = signal(mql.matches);

    // Create handler
    const handler = (event: MediaQueryListEvent) => {
      matches.set(event.matches);
    };

    // Add listener and destroy handler
    mql.addEventListener('change', handler);
    this.destroyRef.onDestroy(() => {
      mql.removeEventListener('change', handler);
    });

    // Store the observer
    this.matchers.set(query, {
      matches,
      handler,
    });

    return matches.asReadonly();
  }
}
