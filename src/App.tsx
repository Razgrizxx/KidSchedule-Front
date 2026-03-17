import { BrowserRouter } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { AudienceSection } from './components/AudienceSection'
import { FeaturesGrid } from './components/FeaturesGrid'
import { Testimonial } from './components/Testimonial'
import { Pricing } from './components/Pricing'
import { Footer } from './components/Footer'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Hero />
          <AudienceSection />
          <FeaturesGrid />
          <Testimonial />
          <Pricing />
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
