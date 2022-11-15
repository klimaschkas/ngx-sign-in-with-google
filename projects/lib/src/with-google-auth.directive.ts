import { Directive, ElementRef } from '@angular/core';
import { WithGoogleAuthService } from "./with-google-auth.service";
import CredentialResponse = google.accounts.id.CredentialResponse;
import { WithGoogleAuthIdToken } from "./definitions";

@Directive({
  selector: 'with-google-auth-button'
})
export class WithGoogleAuthDirective {

  decodeJwt(jwt: string): WithGoogleAuthIdToken {
    let jwt_json = atob(jwt.split(".")[1])
    return JSON.parse(jwt_json)
  }

  constructor(el: ElementRef, authService: WithGoogleAuthService) {
    google.accounts.id.initialize({
      client_id: authService._getClientId(),
      callback: (credentialResponse: CredentialResponse) => {
        authService.idTokenCallback(this.decodeJwt(credentialResponse.credential))
      }
    });
    google.accounts.id.renderButton(el.nativeElement, authService._getButtonConfig());
    if (authService._getEnableOneTap()) {
      google.accounts.id.prompt(); // display the One Tap dialog
    }

  }

}
