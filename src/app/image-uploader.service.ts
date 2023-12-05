import { Injectable } from '@angular/core';
import { Storage, ref, uploadString, getDownloadURL  } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ImageUploaderService {

  constructor(private storage: Storage, private http: HttpClient) { }

  async uploadImageAndGetURL (imageSrc: string, imageName: string): Promise<any> {
    return new Promise<string>((resolve, reject) => {
      this.http.get('/api/image', { params: { url: imageSrc } }).subscribe(async (image: any) => {
        const filePath = `images/${imageName}.png`;
        const storageRef = ref(this.storage, filePath);

        try {
          const snapshot = await uploadString(storageRef, image, 'base64');
          const downloadURL = await getDownloadURL(snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      });
    });
  }  
}
