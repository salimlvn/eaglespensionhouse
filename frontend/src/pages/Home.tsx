import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Rooms from '../components/landing/Rooms';
import Rates from '../components/landing/Rates';
import Location from '../components/landing/Location';
import Footer from '../components/landing/Footer';

const Home = () => {
  return (
    <main className="overflow-x-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#edf6ff_52%,#f8fbff_100%)]">
      <Navbar />
      <Hero />
      <Features />
      <Rooms />
      <Rates/>
      <Location />
      <Footer />
    </main>
  );
};

export default Home;
