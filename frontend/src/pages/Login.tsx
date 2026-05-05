import type { FormEvent } from 'react';
import AuthLayout from '../components/auth/AuthLayout';

function Login() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
          <input
            type="email"
            placeholder="name@example.com"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2a6bc7] focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            placeholder="Enter your password"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2a6bc7] focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-full bg-[#163d73] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f3058]"
        >
          Log In
        </button>
      </form>
    </AuthLayout>
  );
}

export default Login;
