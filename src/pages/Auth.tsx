import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/contexts/BookingContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

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
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-lg backdrop-blur-sm border border-gray-200 shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 md:px-8 py-8">
            {isRecoveryMode ? (
              <>
                <h1 className="text-2xl font-bold text-white mb-1">Reset Password</h1>
                <p className="text-blue-100">Enter your new password</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-white mb-1">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                <p className="text-blue-100">
                  {isLogin ? 'Sign in to continue booking' : 'Sign up to start planning your trip'}
                </p>
              </>
            )}
          </div>

          {/* Form */}
          <div className="p-6 md:p-8">
            {isRecoveryMode ? (
              <form onSubmit={handleRecoveryPasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-900 font-semibold">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-900 font-semibold">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Login/Signup common fields only */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-900 font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-900 font-semibold">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={isLogin ? '' : 'At least 8 characters'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="px-4 py-3 rounded-lg glass border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition-all-smooth disabled:opacity-50"
                    disabled={loading}
                  >
                    {isLogin ? 'Sign In' : 'Sign Up'}
                  </Button>
                </div>
              </form>
            )}

            {signupSuccess && !isRecoveryMode && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Check your email!</strong> A confirmation link has been sent to <strong>{email}</strong>. 
                  Please click the link to confirm your email before signing in.
                </p>
              </div>
            )}

            <div className="mt-6 space-y-3 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setSignupSuccess(false);
                }}
                className="w-full text-sm text-gray-600 hover:text-blue-600 font-semibold transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>

              {isLogin && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="w-full text-sm text-gray-600 hover:text-blue-600 font-semibold transition-colors disabled:opacity-50"
                  disabled={resetting}
                >
                  {resetting ? 'Sending reset link...' : 'Forgot password?'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;