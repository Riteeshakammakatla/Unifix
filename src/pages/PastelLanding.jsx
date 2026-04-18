import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Zap, Shield, Layout, ArrowRight, Check, Star, Command, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PastelLanding.css';

// Intersection Observer Hook for Scroll Reveals
const useScrollReveal = () => {
  const revealRefs = useRef([]);
  revealRefs.current = [];

  const addToRefs = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Optional: stop observing once revealed
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -50px 0px', threshold: 0.1 }
    );

    revealRefs.current.forEach((ref) => {
      observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return addToRefs;
};

const PastelLanding = () => {
  const navigate = useNavigate();
  const addToRefs = useScrollReveal();
  const [scrolled, setScrolled] = useState(false);

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="pastel-wrapper">
      {/* Navigation */}
      <nav className={`pastel-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="pastel-logo">
          <div className="logo-icon">
            <Command size={18} />
          </div>
          <span>Campus IQ</span>
        </div>
        <div className="pastel-nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#about">About</a>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/login')} className="pastel-btn pastel-btn-outline" style={{ padding: '8px 16px' }}>Log in</button>
          <button onClick={() => navigate('/login')} className="pastel-btn" style={{ padding: '8px 16px' }}>Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pastel-section pastel-hero">
        <div className="container">
          <div className="hero-glow"></div>
          
          <div className="animate-on-load">
            <span className="tag">
              <Sparkles size={14} color="#F7CBCA" /> Introducing Campus IQ 2.0
            </span>
          </div>
          
          <h1 className="pastel-title animate-on-load load-delay-100">
            Designed for clarity.<br />
            Built for simplicity.
          </h1>
          
          <p className="pastel-subtitle animate-on-load load-delay-200">
            Experience a deeply thoughtful approach to your workflow. Beautifully crafted tools that feel like pure magic to use every single day.
          </p>
          
          <div className="hero-actions animate-on-load load-delay-300">
            <button onClick={() => navigate('/login')} className="pastel-btn" style={{ padding: '14px 28px', fontSize: '15px' }}>
              Start Free Trial <ArrowRight size={18} />
            </button>
            <button className="pastel-btn pastel-btn-outline" style={{ padding: '14px 28px', fontSize: '15px' }}>
              Watch Demo
            </button>
          </div>

          {/* Apple/Linear style mockup graphic */}
          <div className="hero-mockup-wrapper animate-on-load load-delay-400">
            <div className="hero-mockup-window">
              <div className="hero-mockup-header">
                <div className="mac-controls">
                  <div className="mac-dot pastel-mac-dot1"></div>
                  <div className="mac-dot pastel-mac-dot2"></div>
                  <div className="mac-dot pastel-mac-dot3"></div>
                </div>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <div className="skeleton-block" style={{ width: '200px', height: '24px', borderRadius: '6px', background: 'rgba(93, 107, 107, 0.1)' }}></div>
                </div>
              </div>
              <div className="hero-mockup-body">
                <div className="hero-sidebar">
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="skeleton-block" style={{ height: '32px', width: '80%' }}></div>
                    <div className="skeleton-block" style={{ height: '20px', width: '100%', marginTop: '16px' }}></div>
                    <div className="skeleton-block" style={{ height: '20px', width: '90%' }}></div>
                    <div className="skeleton-block" style={{ height: '20px', width: '95%' }}></div>
                  </div>
                </div>
                <div className="hero-main">
                  <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="skeleton-block" style={{ height: '48px', width: '40%', borderRadius: '12px' }}></div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="skeleton-block" style={{ height: '120px', flex: 1, borderRadius: '16px' }}></div>
                      <div className="skeleton-block" style={{ height: '120px', flex: 1, borderRadius: '16px' }}></div>
                      <div className="skeleton-block" style={{ height: '120px', flex: 1, borderRadius: '16px' }}></div>
                    </div>
                    <div className="skeleton-block" style={{ height: '200px', width: '100%', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(247, 203, 202, 0.1), rgba(198, 215, 216, 0.1))' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="pastel-section">
        <div className="container">
          <div className="section-header reveal" ref={addToRefs}>
            <h2 className="section-title">Everything you need.</h2>
            <p className="pastel-subtitle" style={{ marginBottom: 0 }}>
              Powerful features wrapped in an extraordinarily gentle interface.
            </p>
          </div>

          <div className="pastel-grid-3">
            <div className="pastel-card reveal delay-100" ref={addToRefs}>
              <div className="pastel-icon-wrapper">
                <Sparkles size={24} />
              </div>
              <h3>Intelligent Magic</h3>
              <p>Our tools adapt to your workflow naturally. Less configuration, more creation.</p>
            </div>
            <div className="pastel-card reveal delay-200" ref={addToRefs}>
              <div className="pastel-icon-wrapper">
                <Zap size={24} />
              </div>
              <h3>Lightning Fast</h3>
              <p>Built on modern architecture ensuring your ideas flow without interruption.</p>
            </div>
            <div className="pastel-card reveal delay-300" ref={addToRefs}>
              <div className="pastel-icon-wrapper">
                <Shield size={24} />
              </div>
              <h3>Private by Design</h3>
              <p>Your data remains yours. Bank-grade encryption with uncompromising privacy.</p>
            </div>
            <div className="pastel-card reveal delay-400" ref={addToRefs}>
              <div className="pastel-icon-wrapper">
                <Layout size={24} />
              </div>
              <h3>Elegant Canvas</h3>
              <p>A distraction-free interface carefully tuned to reduce cognitive load.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="container">
        <section className="pastel-section-alt reveal" ref={addToRefs} style={{ textAlign: 'center' }}>
          <h2 className="pastel-title" style={{ fontSize: '48px' }}>Ready to simplify?</h2>
          <p className="pastel-subtitle" style={{ color: 'var(--pastel-text)', opacity: 0.9 }}>
            Join thousands of designers and developers experiencing a new kind of workflow.
          </p>
          <button onClick={() => navigate('/login')} className="pastel-btn" style={{ padding: '16px 36px', fontSize: '16px' }}>
            Get Started for Free <ChevronRight size={18} />
          </button>
        </section>
      </div>

      {/* Pricing Section */}
      <section id="pricing" className="pastel-section">
        <div className="container">
          <div className="section-header reveal" ref={addToRefs}>
            <h2 className="section-title">Simple pricing.</h2>
            <p className="pastel-subtitle" style={{ marginBottom: 0 }}>No hidden fees. Cancel anytime.</p>
          </div>

          <div className="pastel-grid-3" style={{ alignItems: 'center' }}>
            {/* Basic Plan */}
            <div className="pastel-card pastel-pricing-card reveal delay-100" ref={addToRefs}>
              <h3>Starter</h3>
              <div className="pastel-price">$0<span>/mo</span></div>
              <p>Perfect for individuals</p>
              <ul className="pastel-features">
                <li><Check size={18} color="#F7CBCA" /> Up to 3 projects</li>
                <li><Check size={18} color="#F7CBCA" /> Basic analytics</li>
                <li><Check size={18} color="#F7CBCA" /> 24-hour support</li>
              </ul>
              <button className="pastel-btn pastel-btn-outline" style={{ width: '100%', marginTop: 'auto' }}>Choose Starter</button>
            </div>

            {/* Pro Plan */}
            <div className="pastel-card pastel-pricing-card popular reveal delay-200" ref={addToRefs}>
              <span className="tag" style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', margin: 0, background: 'linear-gradient(135deg, var(--pastel-accent), #EBB8B7)', color: 'white', border: 'none' }}>
                <Star size={14} fill="currentColor" /> Most Popular
              </span>
              <h3>Professional</h3>
              <div className="pastel-price">$19<span>/mo</span></div>
              <p>For dedicated creators</p>
              <ul className="pastel-features">
                <li><Check size={18} color="#F7CBCA" /> Unlimited projects</li>
                <li><Check size={18} color="#F7CBCA" /> Advanced analytics</li>
                <li><Check size={18} color="#F7CBCA" /> 1-hour response time</li>
                <li><Check size={18} color="#F7CBCA" /> Custom domains</li>
              </ul>
              <button className="pastel-btn" style={{ width: '100%', marginTop: 'auto' }}>Choose Pro</button>
            </div>

            {/* Team Plan */}
            <div className="pastel-card pastel-pricing-card reveal delay-300" ref={addToRefs}>
              <h3>Team</h3>
              <div className="pastel-price">$49<span>/mo</span></div>
              <p>For growing companies</p>
              <ul className="pastel-features">
                <li><Check size={18} color="#F7CBCA" /> Everything in Pro</li>
                <li><Check size={18} color="#F7CBCA" /> Up to 10 members</li>
                <li><Check size={18} color="#F7CBCA" /> Team collaboration</li>
              </ul>
              <button className="pastel-btn pastel-btn-outline" style={{ width: '100%', marginTop: 'auto' }}>Choose Team</button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="pastel-section" style={{ paddingTop: '60px' }}>
        <div className="container">
          <div className="pastel-grid-3">
            <div className="pastel-card pastel-testimonial reveal delay-100" ref={addToRefs}>
              <div>
                <div style={{ color: '#F7CBCA', marginBottom: '20px', display: 'flex', gap: '4px' }}>
                  <Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/>
                </div>
                <p className="pastel-quote">"Campus IQ has completely transformed how our team works. The interface is so incredibly intuitive, it gets out of your way."</p>
              </div>
              <div className="pastel-author">
                <div className="pastel-avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=47)', backgroundSize: 'cover' }}></div>
                <div>
                  <h4 style={{ color: 'var(--pastel-primary)', fontSize: '15px', fontWeight: 600 }}>Sarah Jenkins</h4>
                  <p style={{ fontSize: '13px', color: 'rgba(93, 107, 107, 0.7)' }}>Product Manager</p>
                </div>
              </div>
            </div>
            <div className="pastel-card pastel-testimonial reveal delay-200" ref={addToRefs}>
              <div>
                <div style={{ color: '#F7CBCA', marginBottom: '20px', display: 'flex', gap: '4px' }}>
                  <Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/>
                </div>
                <p className="pastel-quote">"I've never used software that feels this polished. Every animation, every shadow is perfectly tuned. It's a joy to use."</p>
              </div>
              <div className="pastel-author">
                <div className="pastel-avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=11)', backgroundSize: 'cover' }}></div>
                <div>
                  <h4 style={{ color: 'var(--pastel-primary)', fontSize: '15px', fontWeight: 600 }}>Marcus Thorne</h4>
                  <p style={{ fontSize: '13px', color: 'rgba(93, 107, 107, 0.7)' }}>Lead Designer</p>
                </div>
              </div>
            </div>
            <div className="pastel-card pastel-testimonial reveal delay-300" ref={addToRefs}>
              <div>
                <div style={{ color: '#F7CBCA', marginBottom: '20px', display: 'flex', gap: '4px' }}>
                  <Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/><Star fill="currentColor" size={16}/>
                </div>
                <p className="pastel-quote">"The aesthetics alone make me want to use it every day. But the features and the speed are what keep me here."</p>
              </div>
              <div className="pastel-author">
                <div className="pastel-avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=33)', backgroundSize: 'cover' }}></div>
                <div>
                  <h4 style={{ color: 'var(--pastel-primary)', fontSize: '15px', fontWeight: 600 }}>Elena Rostova</h4>
                  <p style={{ fontSize: '13px', color: 'rgba(93, 107, 107, 0.7)' }}>Frontend Developer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pastel-footer">
        <div className="footer-container">
          <div className="pastel-footer-col">
            <div className="pastel-logo" style={{ marginBottom: '24px' }}>
              <div className="logo-icon">
                <Command size={18} />
              </div>
              <span>Campus IQ</span>
            </div>
            <p style={{ fontSize: '14px', maxWidth: '250px', color: 'rgba(93, 107, 107, 0.8)', lineHeight: 1.6 }}>
              Crafting beautiful tools for the modern creator. Designed with passion and precision.
            </p>
          </div>
          <div className="pastel-footer-col">
            <h4>Product</h4>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Integrations</a>
            <a href="#">Changelog</a>
          </div>
          <div className="pastel-footer-col">
            <h4>Company</h4>
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Blog</a>
            <a href="#">Contact</a>
          </div>
          <div className="pastel-footer-col">
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
        <div style={{ textAlign: 'center', paddingTop: '60px', marginTop: '60px', borderTop: '1px solid rgba(255,255,255,0.4)', color: 'rgba(93, 107, 107, 0.6)', fontSize: '14px' }}>
          &copy; {new Date().getFullYear()} Campus IQ. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PastelLanding;
