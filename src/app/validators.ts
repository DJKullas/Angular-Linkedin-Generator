import { AbstractControl, AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { LinkedinService } from './linkedin.service';
import { Observable, map } from 'rxjs';
import { Firestore, doc, docData } from '@angular/fire/firestore';

export class FormValidators {
    constructor(private readonly linkedInService: LinkedinService, private store: Firestore) { }
    customDomainErrorCheck(): AsyncValidatorFn {
        console.log("HITTING THIS")
        return (control: AbstractControl): Observable<{ [key: string]: any } | null> => {
          const customDomain = control.value;
    
          if (customDomain == "") {
            return new Observable;
          }

          return this.linkedInService.checkDomain(customDomain).pipe(
            map((result: any) => {
              if (result?.error?.error_code === 10006) {
                console.log("Domain is available");
                return null; // Validation passed, return null
              }
    
              if (result?.error?.error_code === 10007) {
                console.log("Incorrect domain format");
                return { format: true }; // Validation failed, return the error object
              }
    
              if (result?.domain) {
                console.log("Domain is not available");
                return { taken: true }; // Validation failed, return the error object
              }
    
              return null; // Validation passed, return null
            })
          );
        };    
      }

    linkedInUrlErrorCheck(): ValidatorFn {
        console.log("HITTING THIS")
        return (control: AbstractControl): { [key: string]: any } | null => {
          const linkedInUrl = control.value;
    

          console.log("URL CHECK")
          if (linkedInUrl != "") {
      
            if (!linkedInUrl.includes("/")) {
              console.log("LinkedIn Url Incorrect Format");
              return { format: true };
            }
      
            var urlArray = linkedInUrl.split("/");
      
            console.log("URL ARRAy" + urlArray);
      
      
            var id = urlArray[urlArray.length - 1];
      
            console.log("ID: " + id);
      
            if (id.length == 0) {
              id = urlArray[urlArray.length - 2];
            }
      
            console.log("ID 2: " + id);
      
            if (id == undefined || id == null) {
              console.log("LinkedIn Url Incorrect format");
              return { format: true };
            }
      
            return null;
          }

          return null;
        };
    }

    
    customUrlErrorCheck(): AsyncValidatorFn {
        console.log("HITTING THIS")
        return (control: AbstractControl): Observable<{ [key: string]: any } | null> => {
          const userSelectedUrl = control.value;
    
          

          console.log("CUSTOM CHECK")
          const url = doc(this.store, "urls/" + userSelectedUrl);
      
          console.log("URL: ");
          console.log(url);
      
          const urlData = docData(url);
      
      
          // TODO unsubscribe maybe so it doesnt hit this multiple times
      
       
          return urlData.pipe(
            map((res: any) => {
            if (res) {
                console.log("URL IS TAKEN CHOOSE ANOTHER");
              return { taken: true }
              

            } 
      
           return null;
          }));
        };    
      }
}


  