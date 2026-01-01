"use client";

import { useState } from "react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Mail, MessageSquare, MapPin, Phone, Send, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const contactMethods = [
  { icon: Mail, title: "Email Us", description: "support@contentai.com", subtitle: "We'll respond within 24 hours" },
  { icon: MessageSquare, title: "Live Chat", description: "Chat with our team", subtitle: "Available 9am-6pm PT" },
  { icon: Phone, title: "Phone", description: "+1 (415) 555-0123", subtitle: "Mon-Fri 9am-5pm PT" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Send className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Message Sent!</h1>
              <p className="text-slate-400 mb-8">
                Thank you for contacting us. We&apos;ll get back to you within 24 hours.
              </p>
              <Button 
                onClick={() => setSubmitted(false)}
                variant="outline" 
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Send Another Message
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      
      <main className="pt-32 pb-20">
        {/* Hero */}
        <section className="pb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                <Mail className="w-4 h-4" />
                <span>Contact Us</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Get in Touch
              </h1>
              
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                Have a question or need help? We&apos;re here for you. Reach out and we&apos;ll respond as soon as possible.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                {contactMethods.map((method, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
                    <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <method.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">{method.title}</h3>
                    <p className="text-cyan-400 mb-1">{method.description}</p>
                    <p className="text-slate-500 text-sm">{method.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Form */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-6">Send us a message</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-300">Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-slate-300">Subject</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="How can we help?"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        required
                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-slate-300">Message</Label>
                      <textarea
                        id="message"
                        rows={5}
                        placeholder="Tell us more about your question or feedback..."
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        required
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white py-6"
                    >
                      {loading ? "Sending..." : "Send Message"}
                      <Send className="w-5 h-5 ml-2" />
                    </Button>
                  </form>
                </div>

                {/* Info */}
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">Other Ways to Reach Us</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold mb-1">Headquarters</h3>
                          <p className="text-slate-400 text-sm">
                            ContentAI Inc.<br />
                            548 Market St #82756<br />
                            San Francisco, CA 94104<br />
                            United States
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold mb-1">Business Hours</h3>
                          <p className="text-slate-400 text-sm">
                            Monday - Friday: 9:00 AM - 6:00 PM PT<br />
                            Saturday - Sunday: Closed
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold mb-1">Support Response Time</h3>
                          <p className="text-slate-400 text-sm">
                            Free users: Within 48 hours<br />
                            Pro users: Within 24 hours<br />
                            Agency users: Within 4 hours
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-2">Looking for Help?</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      Check our Help Center for instant answers to common questions.
                    </p>
                    <a href="/help" className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                      Visit Help Center →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
