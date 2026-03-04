'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { Divider } from 'primereact/divider';
import { Avatar } from 'primereact/avatar';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { Password } from 'primereact/password';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import api, { ApiResponse } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  bio?: string;
  profession?: string;
  company?: string;
  location?: string;
  linkedInUrl?: string;
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  profession?: string;
  company?: string;
  location?: string;
  linkedInUrl?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    profileImageUrl: '',
    bio: '',
    profession: '',
    company: '',
    location: '',
    linkedInUrl: '',
  });

  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  const toast = useRef<Toast>(null);
  const fileUploadRef = useRef<FileUpload>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get<ApiResponse<UserProfile>>('/ui/users/me');
      if (response.data?.data) {
        setProfile(response.data.data);
      }
    } catch (error) {
      console.error('Profile load error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Profil yuklenemedi',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updateData: UpdateProfileData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        bio: profile.bio,
        profession: profile.profession,
        company: profile.company,
        location: profile.location,
        linkedInUrl: profile.linkedInUrl,
      };

      const response = await api.put<ApiResponse<UserProfile>>('/ui/users/me', updateData);
      if (response.data?.data) {
        setProfile(response.data.data);
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: 'Profil guncellendi',
      });
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: error.response?.data?.message || 'Profil guncellenemedi',
      });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyari',
        detail: 'Tum alanlari doldurun',
      });
      return;
    }

    if (passwordData.newPassword !== confirmPassword) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyari',
        detail: 'Yeni sifreler eslesmiyor',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyari',
        detail: 'Yeni sifre en az 6 karakter olmali',
      });
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/ui/users/me/password', passwordData);

      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: 'Sifre degistirildi',
      });

      // Clear password fields
      setPasswordData({ currentPassword: '', newPassword: '' });
      setConfirmPassword('');
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: error.response?.data?.message || 'Sifre degistirilemedi',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const uploadAvatar = async (event: FileUploadHandlerEvent) => {
    const file = event.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ApiResponse<{ profileImageUrl: string }>>('/ui/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.data?.profileImageUrl) {
        setProfile({ ...profile, profileImageUrl: response.data.data.profileImageUrl });
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: 'Profil fotografi guncellendi',
      });

      fileUploadRef.current?.clear();
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: error.response?.data?.message || 'Fotograf yuklenemedi',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = () => {
    const first = profile.firstName?.charAt(0) || '';
    const last = profile.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || profile.email?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <ProgressSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Toast ref={toast} />

      <div className="card">
        <h5 className="mb-4">Profilim</h5>

        <TabView>
          <TabPanel header="Profil Bilgileri" leftIcon="pi pi-user mr-2">
            <div className="grid">
              {/* Avatar Section */}
              <div className="col-12 md:col-4 lg:col-3">
                <Card className="text-center">
                  <div className="flex flex-column align-items-center">
                    {profile.profileImageUrl ? (
                      <img
                        src={profile.profileImageUrl}
                        alt="Profile"
                        className="border-circle mb-3"
                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                      />
                    ) : (
                      <Avatar
                        label={getInitials()}
                        size="xlarge"
                        shape="circle"
                        className="mb-3"
                        style={{ width: '120px', height: '120px', fontSize: '2.5rem', backgroundColor: '#6366f1', color: 'white' }}
                      />
                    )}

                    <h6 className="mb-1">{profile.firstName} {profile.lastName}</h6>
                    <p className="text-500 mb-3">{profile.email}</p>

                    <FileUpload
                      ref={fileUploadRef}
                      mode="basic"
                      accept="image/*"
                      maxFileSize={5000000}
                      customUpload
                      uploadHandler={uploadAvatar}
                      auto
                      chooseLabel={uploadingAvatar ? 'Yukleniyor...' : 'Fotograf Sec'}
                      disabled={uploadingAvatar}
                      className="p-button-outlined"
                    />
                    <small className="text-500 mt-2">Max 5MB, JPG/PNG/GIF</small>
                  </div>
                </Card>
              </div>

              {/* Profile Form */}
              <div className="col-12 md:col-8 lg:col-9">
                <Card>
                  <div className="p-fluid">
                    <div className="grid">
                      <div className="col-12 md:col-6">
                        <div className="field">
                          <label htmlFor="firstName" className="font-bold">Ad</label>
                          <InputText
                            id="firstName"
                            value={profile.firstName || ''}
                            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                            placeholder="Adiniz"
                          />
                        </div>
                      </div>
                      <div className="col-12 md:col-6">
                        <div className="field">
                          <label htmlFor="lastName" className="font-bold">Soyad</label>
                          <InputText
                            id="lastName"
                            value={profile.lastName || ''}
                            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                            placeholder="Soyadiniz"
                          />
                        </div>
                      </div>
                      <div className="col-12 md:col-6">
                        <div className="field">
                          <label htmlFor="email" className="font-bold">E-posta</label>
                          <InputText
                            id="email"
                            value={profile.email}
                            disabled
                            className="surface-200"
                          />
                          <small className="text-500">E-posta degistirilemez</small>
                        </div>
                      </div>
                      <div className="col-12 md:col-6">
                        <div className="field">
                          <label htmlFor="phoneNumber" className="font-bold">Telefon</label>
                          <InputText
                            id="phoneNumber"
                            value={profile.phoneNumber || ''}
                            onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                            placeholder="+90 5XX XXX XX XX"
                          />
                        </div>
                      </div>
                      <div className="col-12 md:col-6">
                        <div className="field">
                          <label htmlFor="profession" className="font-bold">Meslek</label>
                          <InputText
                            id="profession"
                            value={profile.profession || ''}
                            onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                            placeholder="Mesleginiz"
                          />
                        </div>
                      </div>
                      <div className="col-12 md:col-6">
                        <div className="field">
                          <label htmlFor="company" className="font-bold">Sirket</label>
                          <InputText
                            id="company"
                            value={profile.company || ''}
                            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                            placeholder="Calistiginiz sirket"
                          />
                        </div>
                      </div>
                      <div className="col-12 md:col-6">
                        <div className="field">
                          <label htmlFor="location" className="font-bold">Konum</label>
                          <InputText
                            id="location"
                            value={profile.location || ''}
                            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                            placeholder="Sehir, Ulke"
                          />
                        </div>
                      </div>
                      <div className="col-12 md:col-6">
                        <div className="field">
                          <label htmlFor="linkedInUrl" className="font-bold">LinkedIn</label>
                          <InputText
                            id="linkedInUrl"
                            value={profile.linkedInUrl || ''}
                            onChange={(e) => setProfile({ ...profile, linkedInUrl: e.target.value })}
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="field">
                          <label htmlFor="bio" className="font-bold">Hakkimda</label>
                          <InputTextarea
                            id="bio"
                            value={profile.bio || ''}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                            rows={4}
                            placeholder="Kendinizi kisaca tanitın..."
                          />
                        </div>
                      </div>
                    </div>

                    <Divider />

                    <div className="flex justify-content-end">
                      <Button
                        label="Degisiklikleri Kaydet"
                        icon="pi pi-save"
                        onClick={saveProfile}
                        loading={saving}
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Sifre Degistir" leftIcon="pi pi-lock mr-2">
            <div className="grid">
              <div className="col-12 md:col-6 lg:col-5">
                <Card>
                  <Message
                    severity="info"
                    text="Guvenliginiz icin guclu bir sifre secin. En az 6 karakter olmali."
                    className="mb-4 w-full"
                  />

                  <div className="p-fluid">
                    <div className="field">
                      <label htmlFor="currentPassword" className="font-bold">Mevcut Sifre *</label>
                      <Password
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        toggleMask
                        feedback={false}
                        placeholder="Mevcut sifreniz"
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="newPassword" className="font-bold">Yeni Sifre *</label>
                      <Password
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        toggleMask
                        placeholder="Yeni sifreniz"
                        promptLabel="Sifre girin"
                        weakLabel="Zayif"
                        mediumLabel="Orta"
                        strongLabel="Guclu"
                      />
                    </div>

                    <div className="field">
                      <label htmlFor="confirmPassword" className="font-bold">Yeni Sifre Tekrar *</label>
                      <Password
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        toggleMask
                        feedback={false}
                        placeholder="Yeni sifreyi tekrar girin"
                        className={confirmPassword && confirmPassword !== passwordData.newPassword ? 'p-invalid' : ''}
                      />
                      {confirmPassword && confirmPassword !== passwordData.newPassword && (
                        <small className="p-error">Sifreler eslesmiyor</small>
                      )}
                    </div>

                    <Divider />

                    <Button
                      label="Sifreyi Degistir"
                      icon="pi pi-check"
                      onClick={changePassword}
                      loading={changingPassword}
                      disabled={!passwordData.currentPassword || !passwordData.newPassword || !confirmPassword}
                      className="w-full"
                    />
                  </div>
                </Card>
              </div>

              <div className="col-12 md:col-6 lg:col-7">
                <Card title="Sifre Guvenligi Ipuclari">
                  <ul className="line-height-3 pl-3">
                    <li className="mb-2">En az 8 karakter kullanin</li>
                    <li className="mb-2">Buyuk ve kucuk harf karistirin</li>
                    <li className="mb-2">Rakam ve ozel karakter ekleyin (!@#$%)</li>
                    <li className="mb-2">Kisisel bilgilerinizi (dogum tarihi, isim) kullanmayin</li>
                    <li className="mb-2">Her hesap icin farkli sifre kullanin</li>
                    <li>Sifrenizi kimseyle paylasmayın</li>
                  </ul>
                </Card>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </AdminLayout>
  );
}
