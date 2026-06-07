import { Link } from 'react-router';
import { Github, Twitter, Mail } from 'lucide-react';
import './Footer.scss';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <span>Luxe</span>
              <span className="footer__logo-accent">Cart</span>
            </Link>
            <p className="footer__tagline">
              Premium goods for a life well-lived. Curated quality, delivered with care.
            </p>
          </div>

          {/* Shop Links */}
          <div className="footer__links">
            <h4 className="footer__heading">Shop</h4>
            <Link to="/products" className="footer__link">All Products</Link>
            <Link to="/products?category=electronics" className="footer__link">Electronics</Link>
            <Link to="/products?category=clothing" className="footer__link">Clothing</Link>
            <Link to="/products?category=home-garden" className="footer__link">Home & Garden</Link>
            <Link to="/products?category=sports" className="footer__link">Sports</Link>
          </div>

          {/* Company Links */}
          <div className="footer__links">
            <h4 className="footer__heading">Company</h4>
            <Link to="/" className="footer__link">About Us</Link>
            <Link to="/" className="footer__link">Careers</Link>
            <Link to="/" className="footer__link">Contact</Link>
            <Link to="/" className="footer__link">Privacy Policy</Link>
            <Link to="/" className="footer__link">Terms of Service</Link>
          </div>

          {/* Support */}
          <div className="footer__links">
            <h4 className="footer__heading">Support</h4>
            <a href="mailto:support@luxecart.com" className="footer__link">
              <Mail size={14} /> support@luxecart.com
            </a>
            <a href="#" className="footer__link">Help Center</a>
            <a href="#" className="footer__link">Shipping Info</a>
            <a href="#" className="footer__link">Returns</a>
            <a href="#" className="footer__link">Size Guide</a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; {new Date().getFullYear()} LuxeCart. All rights reserved.
          </p>
          <div className="footer__socials">
            <a href="#" className="footer__social-link" aria-label="Twitter"><Twitter size={18} /></a>
            <a href="#" className="footer__social-link" aria-label="GitHub"><Github size={18} /></a>
            <a href="#" className="footer__social-link" aria-label="Email"><Mail size={18} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
