'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Mail, Lock, User, AlertCircle, School } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [faculty, setFaculty] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const router = useRouter();
  const { register } = useAuth();

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

  // Faculties list
  const faculties = [
    { id: 'sci', name: 'Science', color: '#FF6B6B' },
    { id: 'arts', name: 'Arts', color: '#4ECDC4' },
    { id: 'bus', name: 'Business', color: '#FFD166' },
    { id: 'eng', name: 'Engineering', color: '#6A0572' },
    { id: 'med', name: 'Medicine', color: '#06D6A0' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill out all required fields');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const success = await register(name, email, password, faculty);
      
      if (success) {
        router.push('/'); // Redirect to home on success
      } else {
        setError('Registration failed. Email may already be in use.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Registration error:', err);
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
              Create Account
            </CardTitle>
            <CardDescription className="text-center">
              Join SyllaBuzz for collaborative study tools
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
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 border-2"
                    style={{ borderColor: `${colors.primary}40` }}
                    required
                  />
                </div>
              </div>

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
                  <School className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Select value={faculty} onValueChange={setFaculty}>
                    <SelectTrigger 
                      className="pl-10 border-2" 
                      style={{ borderColor: `${colors.primary}40` }}
                    >
                      <SelectValue placeholder="Select Faculty (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {faculties.map((fac) => (
                        <SelectItem key={fac.id} value={fac.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: fac.color }}
                            />
                            <span>{fac.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 border-2"
                    style={{ borderColor: `${colors.primary}40` }}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full py-6 font-semibold text-lg"
                style={{ backgroundColor: colors.primary }}
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="font-semibold hover:underline"
                style={{ color: colors.primary }}
              >
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;