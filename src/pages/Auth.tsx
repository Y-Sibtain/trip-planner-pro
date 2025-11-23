import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useBooking();
  const { toast } = useToast();

  const validate = (email: string, password: string) => {
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
    if (!isLogin && password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validate(email, password);
    if (invalid) {
      toast({ title: 'Validation error', description: invalid, variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
          return;
        }
        setIsAuthenticated(true);
        toast({ title: 'Welcome back!', description: "You've successfully logged in." });
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
          return;
        }
        // If Supabase auto-signs in, data.user will be present. Otherwise an email confirmation will be required.
        if (data?.user) {
          setIsAuthenticated(true);
          toast({
            title: 'Account created!',
            description: 'Your account has been created and you are now signed in.',
          });
          navigate('/');
        } else {
          toast({
            title: 'Account created!',
            description: 'Please check your email to confirm your account.',
          });
          // keep on auth page; user must confirm email
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      toast({ title: 'Unexpected error', description: err?.message ?? 'Something went wrong.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!emailRegex.test(email)) {
      toast({ title: 'Invalid email', description: 'Enter a valid email to reset password', variant: 'destructive' });
      return;
    }
    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Check your email', description: 'Password reset link sent.' });
      }
    } catch (err: any) {
      console.error('Reset error:', err);
      toast({ title: 'Unexpected error', description: err?.message ?? 'Failed to request password reset.', variant: 'destructive' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Sign in to continue booking' : 'Sign up to start planning your trip'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={isLogin ? false : true}
              />
            </div>
            <div className="flex items-center justify-between">
              <Button type="submit" className="w-full" disabled={loading}>
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Button>
            </div>
          </form>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>

            {isLogin && (
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={resetting}
              >
                Forgot password?
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;