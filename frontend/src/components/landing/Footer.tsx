import facebookIcon from '../../assets/icons/facebook.png';
import phoneIcon from '../../assets/icons/phone-call.png';
import placeholderIcon from '../../assets/icons/placeholder.png';
import eagleslogo from '../../assets/images/eaglesnest.jpg';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[linear-gradient(90deg,#0d3768,#0a2d57)] text-blue-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[0.95fr_0.95fr_1.3fr]">
        <div className="flex h-full flex-col justify-between">
          <div className="flex items-center gap-3">
            <img src={eagleslogo} alt="" className="h-10 w-10 object-contain rounded-4xl border" />
            <span className="flex flex-col">
              <span className="font-heading text-[1.8rem] leading-none tracking-wide pb-1">Eagle's</span>
              <span className="text-xs uppercase tracking-[0.32em] text-blue-100">Pension House</span>
            </span>
          </div>
        </div>

        <div className="flex h-full flex-col justify-start">
          <h3 className="font-heading text-xl font-semibold text-white">Contact Us</h3>
          <div className="mt-5 space-y-4 text-sm leading-7 text-blue-100/90">
            <p className="flex items-start gap-3">
              <span className="mt-1 flex h-5 w-5 items-center justify-center">
                <img src={placeholderIcon} alt="" className="h-4 w-4 object-contain" />
              </span>
              <span>Grand Arcade Building, cor. of Plaridel St. and AC Cortes Ave., Mandaue City, Cebu</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="mt-1 flex h-5 w-5 items-center justify-center">
                <img src={phoneIcon} alt="" className="h-4 w-4 object-contain" />
              </span>
              <span>+63 998-956-6044</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="mt-1 flex h-5 w-5 items-center justify-center">
                <img src={facebookIcon} alt="" className="h-4 w-4 object-contain" />
              </span>
              <span>
                <a
                  href="https://www.facebook.com/eagles.pension.house"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  Eagles Pension House
                </a>
              </span>
            </p>
          </div>
        </div>

        <div className="flex h-full flex-col justify-start">
          <h3 className="font-heading text-xl font-semibold text-white">Privacy and Terms</h3>
          <div className="mt-5 space-y-4 text-sm leading-7 text-blue-100/90">
            <p>
              <span className="font-semibold text-white">Privacy:</span> Contact details shared with us are used only for
              reservation inquiries, confirmations, and guest support.
            </p>
            <p>
              <span className="font-semibold text-white">Terms:</span> Room rates are fixed and will not change, and all stays remain subject to house rules and confirmation.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-5 text-center text-sm text-blue-100/80">
          &copy; {currentYear} Eagle's Pension House. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
