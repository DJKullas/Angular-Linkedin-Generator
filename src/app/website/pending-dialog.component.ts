import { Component, Inject, OnInit } from "@angular/core";
import { MatButton, MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: 'pending-dialog',
    templateUrl: 'pending-dialog.html',
    styleUrls: ['./website.component.scss'],
    standalone: true,
    imports: [MatButtonModule],
  })
export class PendingDialog implements OnInit {
    constructor(
      public dialogRef: MatDialogRef<PendingDialog>,
      @Inject(MAT_DIALOG_DATA) public data: any,
    ) {}
  
      title = this.data.title;
      description = this.data.description;

    onNoClick(): void {
      this.dialogRef.close();
    }
  
    ngOnInit() {
 
    }
  }