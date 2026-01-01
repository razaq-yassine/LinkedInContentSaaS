import { 
  Header, 
  Hero, 
  Features, 
  HowItWorks, 
  Testimonials, 
  CTA, 
  Footer 
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
