import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, Heart } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isLoggedIn?: boolean;
  userRole?: 'admin' | 'member';
  userName?: string;
  onLogout?: () => void;
}

export function Header({ isLoggedIn = false, userRole, userName, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = isLoggedIn
    ? userRole === 'admin'
      ? [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/members', label: 'Members' },
          { href: '/payments', label: 'Payments' },
          { href: '/beneficiaries', label: 'Beneficiaries', icon: Heart },
          { href: '/reports', label: 'Reports' },
        ]
      : [
          { href: '/my-dashboard', label: 'My Dashboard' },
          { href: '/my-payments', label: 'My Payments' },
          { href: '/beneficiaries', label: 'Beneficiaries', icon: Heart },
        ]
    : [
        { href: '/#features', label: 'Features' },
        { href: '/#about', label: 'About' },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-navy">
            <span className="text-lg font-bold text-gold">S</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl font-bold text-navy">Sonhara</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Family Finance</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-gold flex items-center gap-1',
                location.pathname === link.href ? 'text-gold' : 'text-muted-foreground'
              )}
            >
              {link.icon && <link.icon className="h-4 w-4" />}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{userName}</span>
                <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold capitalize">
                  {userRole}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button variant="gold" asChild>
                <Link to="/login">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-slide-up">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                  location.pathname === link.href
                    ? 'bg-gold/10 text-gold'
                    : 'hover:bg-muted'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
            <div className="border-t border-border mt-2 pt-2">
              {isLoggedIn ? (
                <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <Button variant="gold" className="w-full" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
