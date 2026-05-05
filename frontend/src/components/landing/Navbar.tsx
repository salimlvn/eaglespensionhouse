import logoImage from '../../assets/images/eaglesnest.jpg';

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[linear-gradient(90deg,#0b3565,#0a2c54)] text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <img
            src={logoImage}
            alt="Eagle's Pension House logo"
            className="h-9 w-9 shrink-0 rounded-full border border-white/20 object-cover shadow-md sm:h-12 sm:w-12"
          />
          <div className="flex min-w-0 flex-col">
            <h1 className="font-heading truncate pb-0.5 text-lg font-semibold leading-none sm:text-2xl">Eagle's</h1>
            <span className="truncate text-[10px] uppercase tracking-[0.18em] text-blue-100 sm:text-xs sm:tracking-[0.28em]">
              Pension House
            </span>
          </div>
        </div>

        <div className="flex shrink-0 gap-1.5 sm:gap-2">
          <button
            type="button"
            className="whitespace-nowrap rounded border border-white px-3 py-1.5 text-xs transition hover:bg-white hover:text-blue-900 sm:px-4 sm:py-1 sm:text-sm"
          >
            Login
          </button>
          <button
            type="button"
            className="whitespace-nowrap rounded bg-blue-500 px-3 py-1.5 text-xs transition hover:bg-blue-400 sm:px-4 sm:py-1 sm:text-sm"
          >
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
