# NgxSignInWithGoogle

## Motivation
[Sign In with Google for Web](https://developers.google.com/identity/gsi/web/guides/overview) offers 
user authentication through Google Accounts. From their website:

    Sign In With Google helps you to quickly and easily manage user authentication and sign-in 
    to your website. Users sign into a Google Account, provide their consent, and securely share 
    their profile information with your platform.
    Customizable buttons and multiple flows are supported for user sign up and sign in.

However, implementing this into an Angular application didn't feel very straightforward, that's why 
this library was created.

## Features
* Easily render the login button with the `with-google-auth-button` directive
* Use the `WithGoogleAuthService` to get id and access tokens, and have them automatically refreshed
* rxjs subject that publishes events like a login or a logout
* Intercepting httpClient requests which match defined prefixes with the `WithGoogleAuthInterceptor` to add access token to the request

## Installation
`npm install ngx-sign-in-with-google`

## Usage
### Setup
At first, follow the [setup guide](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).

Extend your app.module.ts with the following config (more details about the config can be found in the [JavaScript API](https://developers.google.com/identity/gsi/web/reference/js-reference):
```typescript
  imports: [
    ...,
    WithGoogleAuthModule
  ],
  providers: [
    ...,
    {
      provide: 'WithGoogleAuthConfig',
      useValue: {
        clientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
        scopes: 'openid profile email',
        prompt: "none",
        enableOneTap: false,
        buttonConfig: {
          type: 'standard',           // 'standard' | 'icon'
          theme: 'outline',           // 'outline' | 'filled_blue' | 'filled_black'
          size: 'large',              // 'small' | 'medium' | 'large'
          text: 'signin_with',        // 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
          shape: 'rectangular',       // 'rectangular' | 'pill' | 'circle' | 'square'
          logo_alignment: 'left',     // 'left' | 'center' 
          width: '400',               // string, value in pixel
          locale: 'de_DE'             // locale of button text, default is browser's locale
        },
        interceptUrlPrefixes: [
         "https://example.com/v1/auth/",
         "https://example.com/v2/",
        ]
      } as WithGoogleAuthConfig,
    },
    {
          provide: HTTP_INTERCEPTORS,
          useClass: WithGoogleAuthInterceptor,
          multi: true
    },
  ]
```

The `interceptUrlPrefixes` in the example would 
* intercept: https://example.com/v1/auth/some/route
* intercept: https://example.com/v1/auth/
* NOT intercept: https://example.com/v1/auth
* NOT intercept: https://example.com/v1
* NOT intercept: https://example.com/v1/another/route
* intercept: https://example.com/v2/route

If you don't want to intercept anything, assign the interceptUrlPrefixes an empty array.

### Injecting the service
```typescript
constructor(
  private authService: WithGoogleAuthService
) {}
```

### Render login button
```angular2html
<with-google-auth-button></with-google-auth-button>
```

### Access user details
Use `this.authService.getIdToken()` to get an instance of [WithGoogleAuthIdToken](https://github.com/klimaschkas/ngx-sign-in-with-google/blob/master/projects/lib/src/definitions.ts#L3).

```typescript
let idToken = this.authService.getIdToken()
console.log(idToken.name)       // display user's name
```

```angular2html
<!-- Show the user's profile picture if they are logged in -->
<img
  *ngIf="authService.getIdToken() !== undefined"
  [src]="authService.getIdToken()!.picture"
>
```

### Get notified of login/logout
```typescript
let authEvents = this.authService.getEventSubject()

authEvents.subscribe({
  next: (v) => console.log(v.event),
  error: (e) => console.error(e)
})
```

## Author
Simon Klimaschka (@klimaschkas)
