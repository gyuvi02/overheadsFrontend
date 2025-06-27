import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeHu from '@angular/common/locales/hu';
import { LOCALE_ID } from '@angular/core';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Register the locales
registerLocaleData(localeEn, 'en');
registerLocaleData(localeHu, 'hu');

// Detect current language from URL
function getCurrentLocale(): string {
  const pathname = window.location.pathname;
  if (pathname.startsWith('/en')) {
    return 'en';
  }
  return 'hu'; // default
}

const currentLocale = getCurrentLocale();

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers,
    { provide: LOCALE_ID, useValue: currentLocale }
  ]
}).catch(err => console.error(err));
