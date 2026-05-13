import type { ReactNode } from 'react';
import logoImage from '../../assets/images/eaglesnest.jpg';

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  switchLabel: string;
  switchHref: string;
  switchText: string;
};

// Shared shell for login and signup forms.
function AuthLayout({
  title,
  description,
  children,
  switchLabel,
  switchHref,
  switchText,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#edf6ff_52%,#f8fbff_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(22,61,115,0.12)] sm:p-8">
          {/* Brand link returns visitors to the public homepage. */}
          <a href="#/" className="mx-auto flex w-fit items-center gap-3 text-slate-900">
            <img
              src={logoImage}
              alt="Eagle's Pension House logo"
              className="h-11 w-11 rounded-full border border-slate-200 object-cover shadow-sm"
            />
            <div>
              <p className="font-heading text-xl font-bold text-[#163d73]">Eagle's Pension House</p>
            </div>
          </a>

          <div className="mt-8">
            <p className="text-center text-sm font-semibold uppercase tracking-[0.24em] text-[#2a6bc7]"></p>
            <h1 className="mt-3 text-center text-3xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-3 text-center text-sm leading-7 text-slate-600">{description}</p>

            {/* Login and signup forms are passed in as children. */}
            <div className="mt-8">{children}</div>

            <p className="mt-6 text-center text-sm text-slate-500">
              {switchText}{' '}
              <a href={switchHref} className="font-semibold text-[#163d73] hover:text-[#0f3058]">
                {switchLabel}
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuthLayout;
