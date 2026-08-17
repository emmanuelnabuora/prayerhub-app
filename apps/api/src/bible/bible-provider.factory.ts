import { Provider } from '@nestjs/common';
import { PublicDomainBibleProvider } from './providers/public-domain.provider';
import { ApiBibleProvider } from './providers/api-bible.provider';

export const BIBLE_PROVIDER = 'BIBLE_PROVIDER';

// BIBLE_PROVIDER=api_bible in production (licensed translations, real search).
// Defaults to the public-domain provider so the app runs with zero Bible-API
// configuration out of the box — see docs/10-SPRINT-5.md for the trade-offs.
export const bibleProviderFactory: Provider = {
  provide: BIBLE_PROVIDER,
  useFactory: () => {
    return process.env.BIBLE_PROVIDER === 'api_bible'
      ? new ApiBibleProvider()
      : new PublicDomainBibleProvider();
  },
};
