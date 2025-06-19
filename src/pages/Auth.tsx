
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Glasses, ShieldCheck, Zap, Users } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };

    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Logged in successfully.",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !accessCode) {
      toast({
        title: "Error",
        description: "Please fill in all required fields including access code.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create user metadata with display name and store name
      const userData: any = {
        display_name: displayName || email.split('@')[0],
        store_name: storeName || 'Optique',
        access_code: accessCode.toUpperCase()
      };
      
      // Add referral code to metadata if provided
      if (referralCode) {
        userData.referred_by = referralCode;
      }
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account created successfully. You may need to verify your email before logging in.",
      });

      setActiveTab('login');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error.message || "An error occurred during signup.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 p-12 items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white rounded-full"></div>
          <div className="absolute bottom-40 right-20 w-48 h-48 border border-white rounded-full"></div>
          <div className="absolute top-1/2 right-40 w-24 h-24 border border-white rounded-full"></div>
        </div>
        
        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <Glasses className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-bold mb-6">Lensly</h1>
          <p className="text-xl text-white/90 mb-12 leading-relaxed max-w-md">
            Modern optical store management system designed for efficiency and growth
          </p>
          
          {/* Feature highlights */}
          <div className="space-y-6 text-left">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Lightning Fast</h3>
                <p className="text-white/80 text-sm">Optimized for speed and performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Secure & Reliable</h3>
                <p className="text-white/80 text-sm">Enterprise-grade security</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Multi-User Ready</h3>
                <p className="text-white/80 text-sm">Perfect for teams of any size</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Glasses className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Lensly</h1>
            <p className="text-gray-600 mt-2">Optical Store Management</p>
          </div>

          <Card className="border-0 shadow-2xl shadow-black/5">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {activeTab === 'login' ? 'Welcome back' : 'Create account'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {activeTab === 'login' 
                  ? 'Sign in to access your optical store dashboard' 
                  : 'Start managing your optical store today'
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <Tabs 
                defaultValue="login" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-gray-100/80 p-1">
                  <TabsTrigger 
                    value="login" 
                    className="h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-6 mt-0">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium text-sm">
                        Email address
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="name@company.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                        Password
                      </Label>
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl pr-12 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Signing in...</span>
                        </div>
                      ) : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-5 mt-0">
                  <form onSubmit={handleSignup} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-signup" className="text-gray-700 font-medium text-sm">
                          Email*
                        </Label>
                        <Input 
                          id="email-signup" 
                          type="email" 
                          placeholder="name@company.com" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-lg transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="display-name" className="text-gray-700 font-medium text-sm">
                          Name
                        </Label>
                        <Input 
                          id="display-name" 
                          type="text" 
                          placeholder="John Doe" 
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="h-11 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-lg transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="store-name" className="text-gray-700 font-medium text-sm">
                        Store Name
                      </Label>
                      <Input 
                        id="store-name" 
                        type="text" 
                        placeholder="My Optical Store" 
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="h-11 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-lg transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="access-code" className="text-gray-700 font-medium text-sm">
                          Access Code*
                        </Label>
                        <Input 
                          id="access-code" 
                          type="text" 
                          placeholder="ABCDE" 
                          maxLength={5}
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                          className="h-11 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-lg font-mono transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referral-code" className="text-gray-700 font-medium text-sm">
                          Referral
                        </Label>
                        <Input 
                          id="referral-code" 
                          type="text" 
                          placeholder="ABCD" 
                          maxLength={4}
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          className="h-11 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-lg font-mono transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password-signup" className="text-gray-700 font-medium text-sm">
                        Password*
                      </Label>
                      <div className="relative">
                        <Input 
                          id="password-signup" 
                          type={showPassword ? "text" : "password"} 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-lg pr-12 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-gray-700 font-medium text-sm">
                        Confirm Password*
                      </Label>
                      <div className="relative">
                        <Input 
                          id="confirm-password" 
                          type={showConfirmPassword ? "text" : "password"} 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-11 border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-lg pr-12 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Creating account...</span>
                        </div>
                      ) : "Create account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Footer */}
              <div className="text-center mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  By continuing, you agree to our{' '}
                  <span className="text-teal-600 hover:text-teal-700 cursor-pointer font-medium">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-teal-600 hover:text-teal-700 cursor-pointer font-medium">
                    Privacy Policy
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-4">
                  Need help?{' '}
                  <span className="text-teal-600 hover:text-teal-700 cursor-pointer font-medium">
                    Contact Support
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
