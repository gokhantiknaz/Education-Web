'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="flex justify-content-center">
            <i className="pi pi-spin pi-spinner text-4xl"></i>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center mb-4">
          <i
            className="pi pi-book text-5xl mb-3"
            style={{ color: '#1e3a5f' }}
          ></i>
          <h1>Education Platform</h1>
          <p>Sign in to admin panel</p>
        </div>

        {error && (
          <Message severity="error" text={error} className="w-full mb-4" />
        )}

        <form onSubmit={handleSubmit}>
          <div className="field mb-4">
            <label htmlFor="email" className="block mb-2 font-medium">
              Email
            </label>
            <InputText
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full"
              required
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="password" className="block mb-2 font-medium">
              Password
            </label>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full"
              inputClassName="w-full"
              toggleMask
              feedback={false}
              required
            />
          </div>

          <Button
            type="submit"
            label={isSubmitting ? 'Signing in...' : 'Sign In'}
            icon={isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'}
            className="w-full"
            disabled={isSubmitting}
          />
        </form>

        <div className="text-center mt-4">
          <small className="text-color-secondary">
            Only authorized users can sign in
          </small>
        </div>
      </div>
    </div>
  );
}
