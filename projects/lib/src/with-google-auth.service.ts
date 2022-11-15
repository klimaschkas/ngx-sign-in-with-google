import { Inject, Injectable } from '@angular/core';
import GsiButtonConfiguration = google.accounts.id.GsiButtonConfiguration;
import TokenResponse = google.accounts.oauth2.TokenResponse;
import { Subject } from "rxjs";
import {
  WithGoogleAuthConfig,
  WithGoogleAuthEvent,
  WithGoogleAuthIdToken
} from "./definitions";

@Injectable({
  providedIn: 'root'
})
export class WithGoogleAuthService {

  private _idToken?: WithGoogleAuthIdToken;
  private _accessToken?: string;
  private _tokenClient: google.accounts.oauth2.TokenClient | undefined;
  private _event: Subject<WithGoogleAuthEvent> = new Subject()

  constructor(
    @Inject('WithGoogleAuthConfig') private _config: WithGoogleAuthConfig
  ) {
    // load from localStorage first, if localStorage is empty variables will be undefined
    this._loadTokenFromLocalStorage()
    this._initializeTokenClient()
    this._ensureAccessTokenValidity()
  }

  _getButtonConfig(): GsiButtonConfiguration {
    return this._config.buttonConfig
  }

  _getClientId(): string {
    return this._config.clientId
  }

  _getEnableOneTap(): boolean {
    return this._config.enableOneTap
  }

  getIdToken(): WithGoogleAuthIdToken | undefined {
    return this._idToken
  }

  getAccessToken(): string | undefined {
    return this._accessToken
  }

  private _loadTokenFromLocalStorage() {
    this._idToken = WithGoogleAuthService._retrieveIdToken()
    this._accessToken = WithGoogleAuthService._retrieveAccessToken()
  }

  /**
   * Ensures that the access token in usage is valid.
   * This function is usually called when the service is initialized.
   * It checks if an access token is present and requests one if not.
   * Also, if an access token is stored in local storage, it will check if the local storage also
   * stores the expiration of the access token and if the access token might already be expired.
   * @private
   */
  private _ensureAccessTokenValidity() {
    // request a new access token if id token is present but access token is not
    if (this._accessToken === undefined && this._idToken !== undefined) {
      this.requestNewAccessToken()
    }

    // if both access token and id token are present, check if the expired timestamp of the
    // access token is in local storage, if not, request new access token
    if (this._accessToken !== undefined && this._idToken !== undefined) {
      let accessTokenExpiration = WithGoogleAuthService._retrieveAccessTokenExpiration()

      if (accessTokenExpiration === undefined || accessTokenExpiration <= 0) {
        this.requestNewAccessToken()
      } else {
        this._setupAccessTokenRefresh(accessTokenExpiration)
      }
    }
  }

  /**
   * The callback for the Google Auth Login Button.
   * Persists the id token and additionally requests a new access token.
   * @param idToken
   */
  idTokenCallback(idToken: WithGoogleAuthIdToken) {
    this._idToken = idToken
    WithGoogleAuthService._persistIdToken(idToken)

    this.requestNewAccessToken()
    this._event.next({event: "login"})
  }

  /**
   * Initialize the token client, which can retrieve new access tokens.
   * @private
   */
  private _initializeTokenClient() {
    let scope = this._config.scopes
    let prompt = this._config.prompt
    this._tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this._getClientId(),
      scope,
      prompt : prompt,
      hint: this._idToken?.email,
      callback: (tokenResponse: TokenResponse) => {
        if (tokenResponse.error) {
          console.error(tokenResponse.error)
        } else {
          this._accessToken = tokenResponse.access_token
          WithGoogleAuthService._persistAccessToken(this._accessToken!)

          this._setupAccessTokenRefresh(Number(tokenResponse.expires_in))
          WithGoogleAuthService._persistAccessTokenExpiration(Number(tokenResponse.expires_in))
        }
      },
    });
  }

  /**
   * Set a timeout up that will automatically renew the access token once it becomes invalid.
   * @param accessTokenExpiresIn
   * @private
   */
  private _setupAccessTokenRefresh(accessTokenExpiresIn: number) {
    setTimeout(() => {
      this.requestNewAccessToken()
    }, accessTokenExpiresIn * 1000)
  }

  requestNewAccessToken() {
    this._tokenClient?.requestAccessToken({
      hint: this._idToken?.email,
      prompt: ''
    })
  }

  /**
   * Revokes the id token and the access token, removes all stored keys in local storage and emits
   * a logout event.
   */
  public logout() {
    google.accounts.oauth2.revoke(this.getAccessToken()!, () => {})
    google.accounts.id.revoke(this._idToken?.email!, (response) => {
      if(response.error) {
        console.error(response.error)
      }
    })
    WithGoogleAuthService._clearIdToken()
    WithGoogleAuthService._clearAccessToken()
    WithGoogleAuthService._clearAccessTokenExpiration()
    this._idToken = undefined
    this._accessToken = undefined

    this._event.next({event: "logout"})
  }

  /**
   * Get the Subject that emits WithGoogleAuthEvents like a login or a logout.
   */
  public getEventSubject(): Subject<WithGoogleAuthEvent> {
    return this._event
  }

  private static _persistIdToken(idToken: WithGoogleAuthIdToken): void {
    localStorage.setItem(`WithGoogleAuth.IdToken`, JSON.stringify(idToken))
  }

  private static _retrieveIdToken(): WithGoogleAuthIdToken | undefined {
    let socialUserJson = localStorage.getItem(`WithGoogleAuth.IdToken`)
    if (socialUserJson === null) {
      return undefined
    }
    return JSON.parse(socialUserJson);
  }

  private static _clearIdToken(): void {
    localStorage.removeItem(`WithGoogleAuth.IdToken`);
  }

  private static _persistAccessToken(accessToken: string): void {
    localStorage.setItem(`WithGoogleAuth.AccessToken`, accessToken)
  }

  private static _retrieveAccessToken(): string | undefined {
    let accessToken = localStorage.getItem(`WithGoogleAuth.AccessToken`)
    if (accessToken != null) {
      return accessToken
    } else {
      return undefined
    }
  }

  private static _clearAccessToken(): void {
    localStorage.removeItem(`WithGoogleAuth.AccessToken`);
  }

  /**
   * Persist the timestamp when the current access token will expire in local storage.
   * Notice that the function takes the seconds until the token expires in seconds, but stores the
   * information as an unix timestamp.
   * @param expiresIn
   * @private
   */
  private static _persistAccessTokenExpiration(expiresIn: number): void {
    localStorage.setItem(`WithGoogleAuth.AccessTokenExpirationTimestamp`,
      String(WithGoogleAuthService._getCurrentUnixTimestamp() + expiresIn))
  }

  /**
   * Get the stored time in seconds until the access token expires.
   * Notice that the information is saved as a unix timestamp, but will return the time in seconds
   * until the token expires.
   * @private
   */
  private static _retrieveAccessTokenExpiration(): number | undefined {
    let expirationTimestamp = localStorage.getItem(`WithGoogleAuth.AccessTokenExpirationTimestamp`)
    if (expirationTimestamp != null) {
      return Number(expirationTimestamp) - WithGoogleAuthService._getCurrentUnixTimestamp()
    } else {
      return undefined
    }
  }

  private static _clearAccessTokenExpiration(): void {
    localStorage.removeItem(`WithGoogleAuth.AccessTokenExpirationTimestamp`);
  }

  private static _getCurrentUnixTimestamp(): number {
    return Math.floor(Date.now() / 1000)
  }

}
