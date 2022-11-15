import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WithGoogleAuthDirective } from './with-google-auth.directive';
import { WithGoogleAuthService } from "./with-google-auth.service";
import { WithGoogleAuthConfig } from "./definitions";

@NgModule({
  declarations: [
    WithGoogleAuthDirective
  ],
  imports: [
    CommonModule
  ],
  providers: [
    WithGoogleAuthService
  ],
  exports: [
    WithGoogleAuthDirective
  ]
})
export class WithGoogleAuthModule {
    public static initialize(config: WithGoogleAuthConfig): ModuleWithProviders<WithGoogleAuthModule> {
    return {
      ngModule: WithGoogleAuthModule,
      providers: [
        WithGoogleAuthService,
        {
          provide: 'WithGoogleAuthConfig',
          useValue: config
        },
      ]
    };
  }
}

