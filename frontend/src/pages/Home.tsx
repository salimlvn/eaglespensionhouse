import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Rooms from '../components/Rooms';
import Location from '../components/Location';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <main className="overflow-x-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#edf6ff_52%,#f8fbff_100%)]">
      <Navbar />
      <Hero />
      <Features />
      <Rooms />
      <Location />
      <Footer />
    </main>
  );
};

export default Home;