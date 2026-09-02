import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService } from './search.service';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query('q') q: string) {
    if (!q || q.trim().length < 2) {
      return { people: [], rooms: [], groups: [], organizations: [] };
    }
    return this.searchService.search(q.trim());
  }
}
