import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setIsAuthenticated } = useBooking();
  const { toast } = useToast();

  // Check for recovery token or email confirmation in URL
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setIsRecoveryMode(true);
    } else if (type === 'email-confirm') {
      // Email confirmation link clicked - user is already confirmed by Supabase
      // Show success message and redirect to login
      toast({
        title: 'Email confirmed!',
        description: 'Your email has been confirmed. You can now sign in.',
      });
      setIsLogin(true);
      // Clear the URL params
      navigate('/auth');
    }
  }, [searchParams, navigate, toast]);

  const validate = (email: string, password: string) => {
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
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
        // Try to sign in
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
          return;
        }

        // Check if email is confirmed
        if (!data.user?.email_confirmed_at) {
          toast({
            title: 'Email not confirmed',
            description: 'Please confirm your email via the link sent to your inbox.',
            variant: 'destructive',
          });
          return;
        }

        setIsAuthenticated(true);
        toast({ title: 'Welcome back!', description: "You've successfully logged in." });
        navigate('/');
      } else {
        // Sign up - only ask for email and password
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?type=email-confirm`,
          },
        });

        if (authError) {
          if (authError.message?.includes('already registered')) {
            toast({
              title: 'Email already registered',
              description: 'The email is already registered. Please sign in or use a different email.',
              variant: 'destructive',
            });
          } else {
            toast({ title: 'Sign up failed', description: authError.message, variant: 'destructive' });
          }
          return;
        }

        if (authData?.user) {
          setSignupSuccess(true);
          setEmail('');
          setPassword('');
          toast({
            title: 'Account created!',
            description: 'Please check your email for the confirmation link.',
          });
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      toast({
        title: 'Unexpected error',
        description: err?.message ?? 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!emailRegex.test(email)) {
      toast({
        title: 'Invalid email',
        description: 'Enter a valid email to reset password',
        variant: 'destructive',
      });
      return;
    }
    setResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      if (error) {
        toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Check your email', description: 'Password reset link sent.' });
      }
    } catch (err: any) {
      console.error('Reset error:', err);
      toast({
        title: 'Unexpected error',
        description: err?.message ?? 'Failed to request password reset.',
        variant: 'destructive',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleRecoveryPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast({
        title: 'Validation error',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({
          title: 'Update failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Password updated',
          description: 'Your password has been reset successfully.',
        });
        setIsRecoveryMode(false);
        setNewPassword('');
        setConfirmPassword('');
        setIsLogin(true);
        navigate('/auth');
      }
    } catch (err: any) {
      console.error('Recovery error:', err);
      toast({
        title: 'Unexpected error',
        description: err?.message ?? 'Failed to update password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          {isRecoveryMode ? (
            <>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>Enter your new password</CardDescription>
            </>
          ) : (
            <>
              <CardTitle>{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
              <CardDescription>
                {isLogin ? 'Sign in to continue booking' : 'Sign up to start planning your trip'}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {isRecoveryMode ? (
            <form onSubmit={handleRecoveryPasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Login/Signup common fields only */}
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
                  placeholder={isLogin ? '' : 'At least 8 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <Button type="submit" className="w-full" disabled={loading}>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                </Button>
              </div>
            </form>
          )}

          {signupSuccess && !isRecoveryMode && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>Check your email!</strong> A confirmation link has been sent to <strong>{email}</strong>. 
                Please click the link to confirm your email before signing in.
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setSignupSuccess(false);
              }}
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