import { useState, type ChangeEvent, type FormEvent } from 'react';
import AuthLayout from '../components/auth/AuthLayout';
import { AUTH_FIELD_LIMITS, isStrongPassword, PASSWORD_RULES_MESSAGE, signupUser } from '../data/auth';

type SignupProps = {
  onSignupSuccess: (email: string) => void;
};

function Signup({ onSignupSuccess }: SignupProps) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!isStrongPassword(form.password)) {
      setErrorMessage(PASSWORD_RULES_MESSAGE);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (form.fullName.trim().length > AUTH_FIELD_LIMITS.fullName) {
      setErrorMessage(`Full name must be ${AUTH_FIELD_LIMITS.fullName} characters or fewer.`);
      return;
    }

    if (form.email.trim().length > AUTH_FIELD_LIMITS.email) {
      setErrorMessage(`Email must be ${AUTH_FIELD_LIMITS.email} characters or fewer.`);
      return;
    }

    if (form.contactNumber.trim().length > AUTH_FIELD_LIMITS.contactNumber) {
      setErrorMessage(`Contact number must be ${AUTH_FIELD_LIMITS.contactNumber} characters or fewer.`);
      return;
    }

    setIsSubmitting(true);

    try {
      await signupUser(form);
      onSignupSuccess(form.email);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create your account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign up"
      description="Fill out the form below to create an account."
      switchText="Already registered?"
      switchLabel="Log in"
      switchHref="#/login"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
          <input
            name="fullName"
            type="text"
            placeholder="Juan Dela Cruz"
            value={form.fullName}
            onChange={handleChange}
            autoComplete="name"
            maxLength={AUTH_FIELD_LIMITS.fullName}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2a6bc7] focus:ring-4 focus:ring-blue-100"
          />
        </label>

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
          <span className="mb-2 block text-sm font-medium text-slate-700">Contact number</span>
          <input
            name="contactNumber"
            type="tel"
            placeholder="09XXXXXXXXX"
            value={form.contactNumber}
            onChange={handleChange}
            autoComplete="tel"
            maxLength={AUTH_FIELD_LIMITS.contactNumber}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2a6bc7] focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
          <input
            name="password"
            type="password"
            placeholder="Create a strong password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2a6bc7] focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2a6bc7] focus:ring-4 focus:ring-blue-100"
          />
          <span className="mt-2 block text-xs leading-6 text-slate-500">
            Use at least 8 characters with uppercase, lowercase, a number, and a special character.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-[#163d73] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f3058]"
        >
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default Signup;
