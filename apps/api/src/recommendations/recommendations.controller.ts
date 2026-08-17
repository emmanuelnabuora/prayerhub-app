import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecommendationsService } from './recommendations.service';

@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('groups')
  suggestedGroups(@Req() req: any) {
    return this.recommendationsService.suggestedGroups(req.user.userId);
  }

  @Get('people')
  peopleToPrayWith(@Req() req: any) {
    return this.recommendationsService.peopleToPrayWith(req.user.userId);
  }
}
