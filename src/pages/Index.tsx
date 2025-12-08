import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  Shield, 
  BarChart3, 
  ArrowRight,
  Heart,
  Wallet,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Users,
    title: 'Family Member Management',
    description: 'Add, edit, and manage all family members with individual contribution settings for each fund.',
  },
  {
    icon: Wallet,
    title: 'Dual Fund Tracking',
    description: 'Separate tracking for Sonhara Takaful donations and Sonhara Plus investments with detailed breakdowns.',
  },
  {
    icon: Calendar,
    title: 'Monthly Contributions',
    description: 'Track payments month by month, handle partial payments, and manage pending dues effortlessly.',
  },
  {
    icon: BarChart3,
    title: 'Financial Analytics',
    description: 'Visual charts and reports showing collection trends, pending amounts, and fund growth over time.',
  },
  {
    icon: Shield,
    title: 'Secure Access',
    description: 'Role-based access control with admin and member dashboards for appropriate data visibility.',
  },
  {
    icon: TrendingUp,
    title: 'Export Reports',
    description: 'Generate and download reports in Excel or PDF format for record-keeping and sharing.',
  },
];

const funds = [
  {
    name: 'Sonhara Takaful',
    type: 'Donation Fund',
    description: 'A donation-based monthly contribution from each earning family member to support those in need within our family.',
    icon: Heart,
    color: 'navy',
  },
  {
    name: 'Sonhara Plus',
    type: 'Investment Fund',
    description: 'A small monthly investment collected from all family members for future cumulative business projects and opportunities.',
    icon: TrendingUp,
    color: 'gold',
  },
];

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary-foreground blur-3xl" />
        </div>
        
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 text-gold mb-6 animate-fade-in">
              <Heart className="h-4 w-4" />
              <span className="text-sm font-medium">Family Financial Unity</span>
            </div>
            
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-primary-foreground mb-6 animate-slide-up">
              Sonhara Family
              <span className="block text-gold">Finance Portal</span>
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Managing family contributions with transparency and trust. 
              Track donations and investments together for a stronger financial future.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/login">
                  Get Started
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button variant="ghost" size="xl" className="text-primary-foreground hover:text-gold hover:bg-primary-foreground/10" asChild>
                <Link to="#features">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Funds Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mb-4">
              Two Funds, One Family
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our portal manages two distinct contribution programs designed to support our family's present and future needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {funds.map((fund, index) => (
              <div
                key={fund.name}
                className={cn(
                  'relative overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:shadow-xl animate-slide-up',
                  fund.color === 'navy' ? 'bg-gradient-navy text-primary-foreground' : 'bg-gradient-gold text-navy-dark'
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-current opacity-10 blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                
                <div className={cn(
                  'inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6',
                  fund.color === 'navy' ? 'bg-gold/20' : 'bg-navy/20'
                )}>
                  <fund.icon className={cn('h-7 w-7', fund.color === 'navy' ? 'text-gold' : 'text-navy')} />
                </div>
                
                <span className={cn(
                  'inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3',
                  fund.color === 'navy' ? 'bg-primary-foreground/20' : 'bg-navy/20'
                )}>
                  {fund.type}
                </span>
                
                <h3 className="font-serif text-2xl font-bold mb-3">{fund.name}</h3>
                <p className={cn(
                  'text-base mb-6',
                  fund.color === 'navy' ? 'text-primary-foreground/80' : 'text-navy/80'
                )}>
                  {fund.description}
                </p>
                
                <ul className="space-y-2">
                  {['Monthly tracking', 'Payment history', 'Pending dues'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={cn('h-4 w-4', fund.color === 'navy' ? 'text-gold' : 'text-navy')} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage family contributions efficiently and transparently.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 border border-border hover:border-gold/50 hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-navy/10 text-navy mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-navy">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Join our family portal and start tracking contributions today.
            </p>
            <Button variant="gold" size="xl" asChild>
              <Link to="/login">
                Access Portal
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
