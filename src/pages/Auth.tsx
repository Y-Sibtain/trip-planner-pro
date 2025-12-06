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
import { Eye, EyeOff, Check, X } from 'lucide-react';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength checker
const checkPasswordStrength = (password: string) => {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
};

const getPasswordStrengthColor = (password: string) => {
  const strength = checkPasswordStrength(password);
  const metRequirements = Object.values(strength).filter(Boolean).length;
  
  if (metRequirements <= 1) return 'bg-red-500';
  if (metRequirements <= 2) return 'bg-orange-500';
  if (metRequirements <= 3) return 'bg-yellow-500';
  if (metRequirements <= 4) return 'bg-blue-500';
  return 'bg-green-500';
};

const getPasswordStrengthLabel = (password: string) => {
  const strength = checkPasswordStrength(password);
  const metRequirements = Object.values(strength).filter(Boolean).length;
  
  if (!password) return '';
  if (metRequirements <= 1) return 'Weak';
  if (metRequirements <= 2) return 'Fair';
  if (metRequirements <= 3) return 'Good';
  if (metRequirements <= 4) return 'Strong';
  return 'Very Strong';
};

// Requirement Item Component
const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
    {met ? (
      <Check size={14} className="flex-shrink-0" />
    ) : (
      <X size={14} className="flex-shrink-0" />
    )}
    <span>{text}</span>
  </div>
);



const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 p-4 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-10"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden dark:bg-gray-800/50">
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
                  <Label htmlFor="newPassword" className="text-gray-900 dark:text-gray-100 font-semibold">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-gray-100 font-semibold">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
                  <Label htmlFor="email" className="text-gray-900 dark:text-gray-100 font-semibold">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-900 dark:text-gray-100 font-semibold">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={isLogin ? '' : 'At least 8 characters'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="px-4 py-3 rounded-lg glass border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all-smooth pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password Strength Checker - Only show on signup */}
                  {!isLogin && password && (
                    <div className="mt-3 space-y-2">
                      {/* Strength Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${getPasswordStrengthColor(password)}`}
                            style={{ width: `${(Object.values(checkPasswordStrength(password)).filter(Boolean).length / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 min-w-16">
                          {getPasswordStrengthLabel(password)}
                        </span>
                      </div>
                      
                      {/* Requirements Checklist */}
                      <div className="space-y-1">
                        <RequirementItem 
                          met={checkPasswordStrength(password).hasMinLength} 
                          text="At least 8 characters" 
                        />
                        <RequirementItem 
                          met={checkPasswordStrength(password).hasUppercase} 
                          text="At least one uppercase letter (A-Z)" 
                        />
                        <RequirementItem 
                          met={checkPasswordStrength(password).hasLowercase} 
                          text="At least one lowercase letter (a-z)" 
                        />
                        <RequirementItem 
                          met={checkPasswordStrength(password).hasNumber} 
                          text="At least one number (0-9)" 
                        />
                        <RequirementItem 
                          met={checkPasswordStrength(password).hasSpecialChar} 
                          text="At least one special character (!@#$%^&*)" 
                        />
                      </div>
                    </div>
                  )}
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
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Check your email!</strong> A confirmation link has been sent to <strong>{email}</strong>. 
                  Please click the link to confirm your email before signing in.
                </p>
              </div>
            )}

            <div className="mt-6 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setSignupSuccess(false);
                }}
                className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>

              {isLogin && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors disabled:opacity-50"
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