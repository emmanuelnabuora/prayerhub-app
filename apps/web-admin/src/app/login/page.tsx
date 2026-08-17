'use client';

import { useFormState } from 'react-dom';
import { login } from './actions';

export default function LoginPage() {
  const [state, formAction] = useFormState(login, undefined);

  return (
    <div className="login-page">
      <form action={formAction} className="login-card">
        <h1>PrayerHubApp</h1>
        <p className="subtitle">Admin Console</p>
        {state?.error && <p className="error-text">{state.error}</p>}
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button type="submit" style={{ width: '100%' }}>Sign in</button>
      </form>
    </div>
  );
}
