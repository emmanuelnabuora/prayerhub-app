import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SemanticSearchService } from './semantic-search.service';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly semanticSearchService: SemanticSearchService) {}

  @Get('prayers')
  searchPrayers(@Req() req: any, @Query('q') q: string) {
    return this.semanticSearchService.searchPrayerRequests(req.user.userId, q ?? '');
  }
}
