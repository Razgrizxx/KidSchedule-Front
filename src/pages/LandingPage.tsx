import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { Hero } from '@/components/Hero'
import { AudienceSection } from '@/components/AudienceSection'
import { FeaturesGrid } from '@/components/FeaturesGrid'
import { Testimonial } from '@/components/Testimonial'
import { Pricing } from '@/components/Pricing'
import { Footer } from '@/components/Footer'

export function LandingPage() {
  const { hash } = useLocation()

  // When navigated to /#id from another page, scroll to the section once mounted
  useEffect(() => {
    if (!hash) return
    const id = hash.replace('#', '')
    // Small timeout lets the page render before scrolling
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 80)
    return () => clearTimeout(t)
  }, [hash])

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
