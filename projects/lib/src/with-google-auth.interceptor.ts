import {Inject, Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { WithGoogleAuthService } from "./with-google-auth.service";
import { WithGoogleAuthConfig } from "./definitions";

@Injectable({
  providedIn: 'root'
})
export class WithGoogleAuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: WithGoogleAuthService,
    @Inject('WithGoogleAuthConfig') private _config: WithGoogleAuthConfig
  ) {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let interceptTests = this._config.interceptUrlPrefixes.map(prefix => {
      return request.url.startsWith(prefix)
    })

    // count the number of true values in array
    if (interceptTests.filter(Boolean).length >= 1) {
      const accessToken = this.authService.getAccessToken()
      const authRequest = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${accessToken}`)
      })

      return next.handle(authRequest);
    } else {
      // do not intercept when no prefix could be matched
      return next.handle(request)
    }
  }
}
