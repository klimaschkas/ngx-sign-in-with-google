import GsiButtonConfiguration = google.accounts.id.GsiButtonConfiguration;

export interface WithGoogleAuthIdToken {
  iss?: string                 // The JWT's issuer
  nbf?:  string
  aud?: string                 // Your server's client ID
  sub?: string                 // The unique ID of the user's Google Account
  hd?: string                  // If present, the host domain of the user's GSuite email address
  email?: string               // The user's email address
  email_verified?: boolean     // true, if Google has verified the email address
  azp?: string
  name?: string
  picture?: string             // If present, a URL to user's profile picture
  given_name?: string
  family_name?: string
  iat?: string,                // Unix timestamp of the assertion's creation time
  exp?: string,                // Unix timestamp of the assertion's expiration time
  jti?: string
}

export interface AccessTokenInfoResponse {
  azp: string
  aud: string
  string: string
  scope: string
  exp: string
  expires_in: string
  email: string
  email_verified: boolean
  access_type: string
}

export interface WithGoogleAuthConfig {
  clientId: string
  scopes: string
  prompt: "" | "none" | "consent" | "select_account" | undefined
  enableOneTap: boolean
  buttonConfig: GsiButtonConfiguration
  interceptUrlPrefixes: string[]
}

export interface WithGoogleAuthEvent {
  event: "login" | "logout"
  idToken?: WithGoogleAuthIdToken
}
