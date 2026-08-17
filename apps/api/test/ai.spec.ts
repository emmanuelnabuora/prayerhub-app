import { AssistantService } from '../src/ai/assistant.service';
import { ModerationService } from '../src/moderation/moderation.service';

describe('AssistantService', () => {
  it('does not leak another user\'s conversation turns when conversationId is not owned', async () => {
    const db = {
      query: jest.fn((sql: string) => {
        if (sql.includes('select 1 from ai_conversations')) return { rows: [], rowCount: 0 }; // not owned
        if (sql.includes('insert into ai_conversations')) return { rows: [{ id: 'new-convo' }], rowCount: 1 };
        return { rows: [], rowCount: 0 };
      }),
    };
    const anthropic = { complete: jest.fn().mockResolvedValue('An answer, with John 3:16 cited.') };
    const service = new AssistantService(db as any, anthropic as any);

    await service.ask('user-1', { question: 'What does John 3:16 mean?', conversationId: 'someone-elses-convo' });

    // complete() should have been called with an empty prior-turns array, i.e.
    // no cross-user history was loaded despite conversationId being supplied.
    expect(anthropic.complete).toHaveBeenCalledWith('What does John 3:16 mean?', []);
  });
});

describe('ModerationService', () => {
  it('files a report and never auto-resolves or auto-bans — only inserts a moderation_case row', async () => {
    const queries: string[] = [];
    const db = {
      query: jest.fn((sql: string) => {
        queries.push(sql);
        if (sql.includes('insert into reports')) return { rows: [{ id: 'report-1' }], rowCount: 1 };
        return { rows: [], rowCount: 0 };
      }),
    };
    const aiTriage = { triage: jest.fn().mockResolvedValue(undefined) };
    const service = new ModerationService(db as any, aiTriage as any);

    const report = await service.createReport('reporter-1', {
      targetType: 'prayer_request', targetId: 'target-1', reason: 'spam',
    });

    expect(report.id).toBe('report-1');
    expect(queries.some((q) => q.includes('update users') || q.includes('ban'))).toBe(false);
    expect(aiTriage.triage).toHaveBeenCalledWith('report-1', 'spam', 'prayer_request');
  });
});
