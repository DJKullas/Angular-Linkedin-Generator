import { Component, OnInit } from "@angular/core";
import { MatButton, MatButtonModule } from "@angular/material/button";
import { MatDialogRef } from "@angular/material/dialog";

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
    ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }
  
    ngOnInit() {
 
    }
  }