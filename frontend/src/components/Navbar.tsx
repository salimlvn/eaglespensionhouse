import logoImage from '../assets/images/eaglesnest.jpg';

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[linear-gradient(90deg,#0b3565,#0a2c54)] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <img
            src={logoImage}
            alt="Eagle's Pension House logo"
            className="h-12 w-12 rounded-full border border-white/20 object-cover shadow-md"
          />
          <div className="flex flex-col">
            <h1 className="font-[Palatino_Linotype] text-2xl font-semibold leading-none pb-1">Eagle's</h1>
            <span className="text-xs uppercase tracking-[0.28em] text-blue-100">Pension House</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border border-white px-4 py-1 transition hover:bg-white hover:text-blue-900"
          >
            Login
          </button>
          <button
            type="button"
            className="rounded bg-blue-500 px-4 py-1 transition hover:bg-blue-400"
          >
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;