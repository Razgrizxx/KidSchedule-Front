import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { AudienceSection } from '@/components/AudienceSection'
import { FeaturesGrid } from '@/components/FeaturesGrid'
import { Testimonial } from '@/components/Testimonial'
import { Pricing } from '@/components/Pricing'
import { Footer } from '@/components/Footer'

export function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AudienceSection />
        <FeaturesGrid />
        <Testimonial />
        <Pricing />
      </main>
      <Footer />
    </>
  )
}
