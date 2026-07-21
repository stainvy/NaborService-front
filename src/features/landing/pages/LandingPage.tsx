import { PublicLayout } from '@/components/PublicLayout';
import { Hero } from '../components/Hero';
import { Reassurance } from '../components/Reassurance';
import { Features } from '../components/Features';
import { HowItWorks } from '../components/HowItWorks';
import { CommunityValues } from '../components/CommunityValues';
import { FinalCta } from '../components/FinalCta';

// Vitrine marketing publique (visiteurs non connectés).
export function LandingPage() {
  return (
    <PublicLayout>
      <Hero />
      <Reassurance />
      <Features />
      <HowItWorks />
      <CommunityValues />
      <FinalCta />
    </PublicLayout>
  );
}
