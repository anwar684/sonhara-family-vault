import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user, userRole, isLoading: authLoading } = useAuth();

  // Redirect after successful login when userRole is available
  useEffect(() => {
    if (loginSuccess && user && userRole) {
      if (userRole === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/my-dashboard');
      }
    }
  }, [loginSuccess, user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp) {
      if (!fullName.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter your full name',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Account created!',
          description: 'You can now sign in with your credentials.',
        });
        setIsSignUp(false);
        setFullName('');
      }
    } else {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
      });
      
      // Set flag to trigger redirect when userRole is available
      setLoginSuccess(true);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-navy">
                <span className="text-xl font-bold text-gold">S</span>
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-navy">Sonhara</h1>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Family Finance</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-serif text-3xl font-bold text-navy mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp 
                ? 'Sign up to join the Sonhara family portal.' 
                : 'Sign in with the credentials provided by your administrator.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="navy"
              className="w-full h-12"
              disabled={isLoading}
            >
              {isLoading 
                ? (isSignUp ? 'Creating account...' : 'Signing in...') 
                : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-navy font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-navy font-medium hover:underline"
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right Panel - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary-foreground blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gold/20 mb-6">
            <span className="text-4xl font-bold text-gold font-serif">S</span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-primary-foreground mb-4">
            Family Finance Portal
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Track and manage family contributions for Sonhara Takaful and Sonhara Plus funds with complete transparency.
          </p>
          
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-4">
              <p className="text-xl font-bold text-gold font-serif">Takaful</p>
              <p className="text-xs text-primary-foreground/70">Donation Fund</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-4">
              <p className="text-xl font-bold text-gold font-serif">Plus</p>
              <p className="text-xs text-primary-foreground/70">Investment</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-4">
              <p className="text-xl font-bold text-gold font-serif">Aid</p>
              <p className="text-xs text-primary-foreground/70">Beneficiaries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}