// src/app/shared/loading-spinner/loading-spinner.component.ts
import { Component } from '@angular/core';
import { LoadingService } from '../../core/loading.service';
import { CommonModule } from '@angular/common';

@Component({
  
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
  imports: [CommonModule]
})
export class LoadingSpinnerComponent {

  isLoading;

  constructor(private loadingService: LoadingService) {
    this.isLoading = this.loadingService.loading$;
  }
}
