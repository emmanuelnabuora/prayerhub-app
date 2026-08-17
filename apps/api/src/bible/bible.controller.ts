import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BibleService } from './bible.service';
import { CreateBookmarkDto } from './dto';

// Bible reading itself doesn't need to be gated behind auth in principle, but every
// other module in this API requires a session, and keeping that consistent means
// one auth story for the whole app rather than a public/private split — this can
// be revisited if a logged-out "preview" experience is wanted later.
@UseGuards(JwtAuthGuard)
@Controller('bible')
export class BibleController {
  constructor(private readonly bibleService: BibleService) {}

  @Get('books')
  listBooks() {
    return this.bibleService.listBooks();
  }

  @Get('chapters/:bookId/:chapter')
  getChapter(@Param('bookId') bookId: string, @Param('chapter') chapter: string) {
    return this.bibleService.getChapter(bookId, Number(chapter));
  }

  @Get('verses/:bookId/:chapter/:verseStart')
  getVerses(
    @Param('bookId') bookId: string,
    @Param('chapter') chapter: string,
    @Param('verseStart') verseStart: string,
    @Query('verseEnd') verseEnd?: string,
  ) {
    return this.bibleService.getVerses(bookId, Number(chapter), Number(verseStart), verseEnd ? Number(verseEnd) : undefined);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.bibleService.search(q);
  }

  @Get('daily-verse')
  dailyVerse() {
    return this.bibleService.dailyVerse();
  }

  @Get('bookmarks')
  listBookmarks(@Req() req: any) {
    return this.bibleService.listBookmarks(req.user.userId);
  }

  @Post('bookmarks')
  addBookmark(@Req() req: any, @Body() dto: CreateBookmarkDto) {
    return this.bibleService.addBookmark(req.user.userId, dto);
  }

  @Delete('bookmarks/:id')
  removeBookmark(@Param('id') id: string, @Req() req: any) {
    return this.bibleService.removeBookmark(id, req.user.userId);
  }
}
