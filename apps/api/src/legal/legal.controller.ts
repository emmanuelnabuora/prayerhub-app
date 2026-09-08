import { Controller, Get, Header } from '@nestjs/common';
import { PRIVACY_POLICY_HTML } from './privacy-content';
import { TERMS_OF_SERVICE_HTML } from './terms-content';

// Deliberately no auth guard — app stores and the general public need to
// reach these pages, and they're required at submission time for both the
// App Store and Google Play regardless of whether someone has an account.
@Controller('legal')
export class LegalController {
  @Get('privacy')
  @Header('Content-Type', 'text/html')
  privacy() {
    return PRIVACY_POLICY_HTML;
  }

  @Get('terms')
  @Header('Content-Type', 'text/html')
  terms() {
    return TERMS_OF_SERVICE_HTML;
  }
}
