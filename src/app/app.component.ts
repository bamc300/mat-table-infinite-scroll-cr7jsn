import {Component, OnInit, AfterViewInit, ViewChild, ElementRef, Renderer2} from '@angular/core';
import {BehaviorSubject, Observable, fromEvent} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {MatTable} from '@angular/material';

@Component({
  selector: 'my-table',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent implements OnInit, AfterViewInit {
  //@ViewChild(MatTable) public matTable: MatTable<Element[]>;
  @ViewChild('table', {read: ElementRef}) public matTableRef: ElementRef;
  public displayedColumns: string[] = ['pagenumber', 'indexnumber'];
  public dataSource: Observable<Element[]>;
  private dataStream: BehaviorSubject<Element[]>;
  private numberOfPagesInBuffer: number = 3;
  private firstPage: number = 1;
  private pageSize: number = 50;
  private totalNumberOfPages: number = 10; // input

  public get lastPage(): number {
    return Math.min(this.totalNumberOfPages, this.firstPage + this.numberOfPagesInBuffer -1);
  }
  
  constructor(private el: ElementRef,
              private renderer: Renderer2) {
    this.dataStream = new BehaviorSubject<Element[]>([]);
    this.dataSource = this.dataStream.asObservable();
  }
  
  public ngOnInit(): void {
    this.fetchData();
  }
  
  public ngAfterViewInit(): void {
    fromEvent(this.matTableRef.nativeElement, 'scroll')
         .pipe(debounceTime(700))
         .subscribe((e: any) => this.onTableScroll(e));
  }
  
  private onTableScroll(e: any): void {
    const tableViewHeight = e.target.offsetHeight // viewport: ~500px
    const tableScrollHeight = e.target.scrollHeight // length of all table
    const scrollLocation = e.target.scrollTop; // how far user scrolled
    
    // If the user has scrolled within 200px of the bottom, add more data
    const scrollThreshold = 200;
    
    const scrollUpLimit = scrollThreshold;
    if (scrollLocation < scrollUpLimit && this.firstPage > 1) {
      this.firstPage--;
      console.log(`onTableScroll() UP: firstPage decreased to ${this.firstPage}. Now fetching data...`);
      this.fetchData();
      this.scrollTo(tableScrollHeight/2 - 2*tableViewHeight);
    }
    
    const scrollDownLimit = tableScrollHeight - tableViewHeight - scrollThreshold;    
    if (scrollLocation > scrollDownLimit && this.lastPage < this.totalNumberOfPages) {
      this.firstPage++;
      console.log(`onTableScroll(): firstPage increased to ${this.firstPage}. Now fetching data...`);
      this.fetchData();
      this.scrollTo(tableScrollHeight/2 + tableViewHeight);
    }
  }
  
  private fetchData(): void {
    let pageData: Element[] = [];
    for (let i=this.firstPage; i<=this.lastPage; i++) {
      pageData = pageData.concat(this.generateFakePageData(i));
    }
    this.dataStream.next(pageData);
  }
  
  private generateFakePageData(forPage: number): Element[] {
    let fakePageData = [];
    fakePageData.push(...Array.from<Element>({length: this.pageSize}).map((_: any, i: number) => { return {page: ''+forPage, index: i+1}; }));
    return fakePageData;
  }
  
  private scrollTo(position: number): void {
    this.renderer.setProperty(this.matTableRef.nativeElement, 'scrollTop', position);
  }
}
