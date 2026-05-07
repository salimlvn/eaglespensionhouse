import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import { AUTH_FIELD_LIMITS, consumeSignupSuccessState, loginUser, type AuthSession } from '../data/auth';

type LoginProps = {
  onAuthenticated: (session: AuthSession) => void;
};

function Login({ onAuthenticated }: LoginProps) {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const signupState = consumeSignupSuccessState();

    if (!signupState) {
      return;
    }

    setSuccessMessage(signupState.message);
    setForm((current) => ({
      ...current,
      email: signupState.email,
    }));
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    if (form.email.trim().length > AUTH_FIELD_LIMITS.email) {
      setErrorMessage(`Email must be ${AUTH_FIELD_LIMITS.email} characters or fewer.`);
      setIsSubmitting(false);
      return;
    }

    try {
      const session = await loginUser(form);
      onAuthenticated(session);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to log in right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      description="Enter your email and password to continue."
      switchText="Need an account?"
      switchLabel="Create one"
      switchHref="#/signup"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
          <input
            name="email"
            type="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            maxLength={AUTH_FIELD_LIMITS.email}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2a6bc7] focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2a6bc7] focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-[#163d73] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f3058]"
        >
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
