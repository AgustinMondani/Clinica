import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoadingService } from '../../core/loading.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  imports: [CommonModule]
})
export class SpinnerComponent implements OnInit, OnDestroy {
  loading = false;
  private subscription!: Subscription;

  constructor(private loadingService: LoadingService) {}

  ngOnInit() {
    this.subscription = this.loadingService.loading$.subscribe(
      (isLoading) => {
        this.loading = isLoading;
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
