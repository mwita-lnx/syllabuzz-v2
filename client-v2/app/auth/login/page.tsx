'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Mail, Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const router = useRouter();
  const { login } = useAuth();

  // Theme colors
  const colors = {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    tertiary: '#FFD166',
    quaternary: '#6A0572',
    background: '#FFFFFF',
    surface: '#F7F9FC',
    textPrimary: '#2D3748',
    textSecondary: '#4A5568',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple validation
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(email, password);
      
      if (success) {
        router.push('/'); // Redirect to home on success
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8" style={{ color: colors.primary }} />
            <h1 className="text-3xl font-bold title-font" style={{ color: colors.primary }}>SyllaBuzz</h1>
          </div>
        </div>

        <Card className="shadow-xl border-t-4" style={{ borderTopColor: colors.primary }}>
          <CardHeader>
            <CardTitle className="text-2xl text-center" style={{ color: colors.primary }}>
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center">
              Log in to your SyllaBuzz account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 bg-red-50 border-red-200 text-red-800">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-2"
                    style={{ borderColor: `${colors.primary}40` }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-2"
                    style={{ borderColor: `${colors.primary}40` }}
                    required
                  />
                </div>
                <div className="text-right">
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm hover:underline"
                    style={{ color: colors.primary }}
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full py-6 font-semibold text-lg"
                style={{ backgroundColor: colors.primary }}
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Log in'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                href="/auth/register" 
                className="font-semibold hover:underline"
                style={{ color: colors.primary }}
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;