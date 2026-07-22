import React from 'react';
import { Hero } from './Hero';
import { PopularProducts } from './PopularProducts';
import { BestsellersNewArrivals } from './BestsellersNewArrivals';
import { Boutique } from './Boutique';
import { GiftHampers } from './GiftHampers';
import { Reviews } from './Reviews';
import { Stats } from './Stats';
import { InstagramReels } from './InstagramReels';

export { OurStoryPage } from './OurStoryPage';
export { ContactPage } from './ContactPage';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ background: 'var(--black)', width: '100vw', overflowX: 'hidden' }}>
      <Hero />
      <PopularProducts />
      <BestsellersNewArrivals />
      <GiftHampers />
      <Boutique />
      <Reviews />
      <Stats />
      <InstagramReels />
    </div>
  );
};

export default LandingPage;

