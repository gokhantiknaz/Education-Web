'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import api from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Gecersiz veya eksik sifirlama baglantisi.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Sifreler eslesmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Sifre en az 6 karakter olmali.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/ui/auth/reset-password', {
        token,
        newPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sifre sifirlanamadi. Baglanti suresi dolmus olabilir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="text-center">
            <i
              className="pi pi-exclamation-triangle text-5xl mb-3 text-orange-500"
            ></i>
            <h1>Gecersiz Baglanti</h1>
            <p className="text-color-secondary mb-4">
              Sifre sifirlama baglantisi gecersiz veya eksik.
            </p>
            <Link href="/forgot-password">
              <Button
                label="Yeni Baglanti Iste"
                icon="pi pi-refresh"
                className="mr-2"
              />
            </Link>
            <Link href="/login">
              <Button
                label="Giris Yap"
                icon="pi pi-sign-in"
                className="p-button-text"
              />
            </Link>
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
            className="pi pi-key text-5xl mb-3"
            style={{ color: '#1e3a5f' }}
          ></i>
          <h1>Yeni Sifre Belirle</h1>
          <p className="text-color-secondary">
            Yeni sifrenizi girin.
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <Message
              severity="success"
              className="w-full mb-4"
              text="Sifreniz basariyla degistirildi!"
            />
            <p className="text-sm text-color-secondary mb-4">
              Yeni sifrenizle giris yapabilirsiniz.
            </p>
            <Link href="/login">
              <Button
                label="Giris Yap"
                icon="pi pi-sign-in"
              />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <Message severity="error" text={error} className="w-full mb-4" />
            )}

            <div className="field mb-4">
              <label htmlFor="newPassword" className="block mb-2 font-medium">
                Yeni Sifre
              </label>
              <Password
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni sifrenizi girin"
                className="w-full"
                inputClassName="w-full"
                toggleMask
                promptLabel="Sifre girin"
                weakLabel="Zayif"
                mediumLabel="Orta"
                strongLabel="Guclu"
                required
              />
            </div>

            <div className="field mb-4">
              <label htmlFor="confirmPassword" className="block mb-2 font-medium">
                Sifre Tekrar
              </label>
              <Password
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Sifrenizi tekrar girin"
                className="w-full"
                inputClassName="w-full"
                toggleMask
                feedback={false}
                required
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <small className="p-error">Sifreler eslesmiyor</small>
              )}
            </div>

            <Button
              type="submit"
              label={isSubmitting ? 'Kaydediliyor...' : 'Sifreyi Degistir'}
              icon={isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
              className="w-full mb-3"
              disabled={isSubmitting || !newPassword || !confirmPassword}
            />

            <div className="text-center">
              <Link href="/login" className="text-primary text-sm no-underline hover:underline">
                <i className="pi pi-arrow-left mr-1"></i>
                Giris sayfasina don
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
