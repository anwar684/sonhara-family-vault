import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-navy text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold">
                <span className="text-lg font-bold text-navy">S</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold">Sonhara</span>
                <span className="text-[10px] uppercase tracking-wider text-primary-foreground/60">Family Finance</span>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/70 max-w-md">
              Managing family contributions with transparency and trust. Building a stronger financial future together through Takaful and Plus funds.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-gold">Funds</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <Link to="/takaful" className="hover:text-gold transition-colors">
                  Sonhara Takaful
                </Link>
              </li>
              <li>
                <Link to="/plus" className="hover:text-gold transition-colors">
                  Sonhara Plus
                </Link>
              </li>
              <li>
                <Link to="/reports" className="hover:text-gold transition-colors">
                  Reports
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-gold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <Link to="/login" className="hover:text-gold transition-colors">
                  Member Login
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-gold transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-gold transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/10 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/50">
            © {new Date().getFullYear()} Sonhara Family Fund. All rights reserved.
          </p>
          <p className="text-sm text-primary-foreground/50 flex items-center gap-1">
            Made with <Heart className="h-4 w-4 text-gold fill-gold" /> for our family
          </p>
        </div>
      </div>
    </footer>
  );
}
