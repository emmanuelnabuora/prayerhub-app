import { AuthService } from '../src/auth/auth.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

// Lightweight unit test using a fake pg Pool + JwtService, demonstrating the pattern —
// expand with real integration tests against a test Postgres instance in CI.
describe('AuthService', () => {
  function makeService(rows: Record<string, any[]>) {
    const db = {
      query: jest.fn((sql: string) => {
        if (sql.startsWith('select id from users')) return { rows: rows.existingUser ?? [], rowCount: (rows.existingUser ?? []).length };
        if (sql.startsWith('insert into users')) return { rows: rows.insertedUser ?? [], rowCount: 1 };
        return { rows: [], rowCount: 0 };
      }),
    };
    const jwt = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    return new AuthService(db as any, jwt as any);
  }

  it('rejects registration when email already exists', async () => {
    const service = makeService({ existingUser: [{ id: 'u1' }] });
    await expect(
      service.register({ email: 'a@b.com', password: 'password123', username: 'a', displayName: 'A' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects login with unknown email', async () => {
    const service = makeService({});
    await expect(
      service.login({ email: 'nope@b.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
