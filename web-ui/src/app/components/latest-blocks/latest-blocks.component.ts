
import {tap, merge, switchMap} from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Subscription ,  Subject ,  of } from 'rxjs';

import { Block } from '../../models/block';

import { BlocksService } from '../../services/blocks.service';
import { ErrorService } from '../../services/error.service';

@Component({
  selector: 'app-latest-blocks',
  templateUrl: './latest-blocks.component.html',
  styleUrls: ['./latest-blocks.component.css']
})
export class LatestBlocksComponent implements OnInit, OnDestroy {

  blocks: Block[] = [];
  private latestBlockHeight = 0;
  private subscription$: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blocksService: BlocksService,
    private errorService: ErrorService) { }

  ngOnInit() {
    this.updateBlocks();
  }

  ngOnDestroy() {
    if (this.subscription$ != null) {
      this.subscription$.unsubscribe();
    }
  }

  private updateBlocks() {
    const polling$ = new Subject();

    /**
     * There is around 1 new block per minute, it is a waste of resources
     * to be checking for new blocks quite frequently.
     */
    const interval = 50000;

    // polling based on https://stackoverflow.com/a/42659054/3211175
    this.subscription$ = of(null).pipe(
      merge(polling$),
      switchMap(_ =>
        this.blocksService.getLatest().pipe(
          tap(_ => {
            setTimeout(_ => polling$.next(null), interval);
          }))
      ),)
      .subscribe(
        response => this.onBlockRetrieved(response),
        response => this.onError(response)
      );
  }

  private onBlockRetrieved(response: Block[]) {
    this.latestBlockHeight = this.blocks.reduce((max, block) => Math.max(block.height, max), 0);
    this.blocks = response;
  }

  private onError(response: any) {
    this.errorService.renderServerErrors(null, response);
  }

  extractedBy(block: Block): string {
    if (block.height <= 75) {
      return 'PoW';
    }

    if (block.tposContract == null) {
      return 'PoS';
    } else {
      return 'TPoS';
    }
  }

  age(block: Block): string {
    return '';
  }

  isBlockRecent(item: Block): boolean {
    return item.height > this.latestBlockHeight;
  }
}
