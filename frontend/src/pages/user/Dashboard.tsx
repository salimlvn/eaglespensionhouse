import logoImage from '../../assets/images/eaglesnest.jpg';
import { features } from '../../data/features';
import { rates } from '../../data/rates';
import { rooms } from '../../data/rooms';
import type { AuthSession } from '../../data/auth';

type DashboardProps = {
  session: AuthSession;
  onLogout: () => void;
};

// Guest dashboard shown after a successful login.
function Dashboard({ session, onLogout }: DashboardProps) {
  // Reuse a small slice of homepage data as temporary dashboard content.
  const featuredRooms = rooms.slice(0, 3);
  const guestFeatures = features.slice(0, 4);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef7ff_0%,#dbeeff_34%,#f7fbff_72%,#ffffff_100%)] text-slate-900">
      {/* Header keeps account navigation simple after login. */}
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="#/" className="flex min-w-0 items-center gap-3">
            <img
              src={logoImage}
              alt="Eagle's Pension House logo"
              className="h-11 w-11 rounded-full border border-slate-200 object-cover shadow-sm"
            />
            <div className="min-w-0">
              <p className="font-heading truncate text-xl font-bold text-[#163d73]">Eagle&apos;s Pension House</p>
              <p className="truncate text-xs uppercase tracking-[0.18em] text-slate-500">Guest Landing Page</p>
            </div>
          </a>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </header>

      {/* Welcome panel and account summary. */}
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.3fr_0.7fr] lg:py-12">
        <article className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#163d73_0%,#2a6bc7_58%,#6fb3ff_100%)] p-8 text-white shadow-[0_30px_80px_rgba(22,61,115,0.28)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-100">Welcome back</p>
          <h1 className="mt-4 max-w-2xl font-heading text-4xl font-bold leading-tight sm:text-5xl">
            Hello, {session.user.fullName.split(' ')[0]}.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50 sm:text-base">
            Your account is ready. This sample landing page shows the kind of guest dashboard you can send people to
            after they log in or create an account.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#rates"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#163d73] transition hover:bg-blue-50"
            >
              View rates
            </a>
            <a
              href="tel:09989566044"
              className="rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Call front desk
            </a>
          </div>
        </article>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2a6bc7]">Your account</p>
          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Name</p>
              <p className="mt-1 text-base font-semibold text-slate-900">{session.user.fullName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
              <p className="mt-1 text-sm text-slate-700">{session.user.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Contact number</p>
              <p className="mt-1 text-sm text-slate-700">{session.user.contactNumber}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
              <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Active guest account
              </span>
            </div>
          </div>
        </aside>
      </section>

      {/* Short feature preview from the public homepage. */}
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {guestFeatures.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2a6bc7]">Feature</p>
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Room preview cards for future booking-related content. */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2a6bc7]">Preview rooms</p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-slate-900">Sample landing content after login</h2>
          </div>
          <a href="#/home" className="text-sm font-semibold text-[#163d73] hover:text-[#0f3058]">
            View public homepage
          </a>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {featuredRooms.map((room) => (
            <article
              key={room.title}
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
            >
              <img src={room.image} alt={room.title} className="h-56 w-full object-cover" />
              <div className="p-5">
                <h3 className="text-xl font-semibold text-slate-900">{room.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Use this section for availability, booking prompts, or guest announcements once your next features are
                  ready.
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Current rate information stays visible inside the guest dashboard. */}
      <section id="rates" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:pb-14">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2a6bc7]">Current rates</p>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {rates.map((rate) => (
              <article key={rate.id} className="rounded-[1.5rem] bg-slate-50 p-5">
                <h3 className="text-xl font-semibold text-slate-900">{rate.title}</h3>
                <div className="mt-4 space-y-2 text-sm leading-7 text-slate-600">
                  {rate.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
