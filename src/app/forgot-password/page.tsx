'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/ui/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      // Always show success message for security (don't reveal if email exists)
      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="text-center mb-4">
          <i
            className="pi pi-lock text-5xl mb-3"
            style={{ color: '#1e3a5f' }}
          ></i>
          <h1>Sifremi Unuttum</h1>
          <p className="text-color-secondary">
            E-posta adresinizi girin, sifre sifirlama baglantisi gonderelim.
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <Message
              severity="success"
              className="w-full mb-4"
              text="E-posta adresiniz sistemde kayitliysa, sifre sifirlama baglantisi gonderildi."
            />
            <p className="text-sm text-color-secondary mb-4">
              Lutfen e-posta kutunuzu kontrol edin. Baglanti 1 saat gecerlidir.
            </p>
            <Link href="/login">
              <Button
                label="Giris Sayfasina Don"
                icon="pi pi-arrow-left"
                className="p-button-text"
              />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <Message severity="error" text={error} className="w-full mb-4" />
            )}

            <div className="field mb-4">
              <label htmlFor="email" className="block mb-2 font-medium">
                E-posta Adresi
              </label>
              <InputText
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full"
                required
                autoFocus
              />
            </div>

            <Button
              type="submit"
              label={isSubmitting ? 'Gonderiliyor...' : 'Sifirlama Baglantisi Gonder'}
              icon={isSubmitting ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
              className="w-full mb-3"
              disabled={isSubmitting || !email}
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
