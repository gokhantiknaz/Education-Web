'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import api, { ApiResponse } from '@/lib/api';
import { InputNumber } from 'primereact/inputnumber';
import { StorageSettings, AwsRegion, StorageConnectionTestResult, GeneralSettings, CloudFrontSettings, CloudFrontTestResult, EmailSettings, EmailTestResult } from '@/types';
import { InputSwitch } from 'primereact/inputswitch';
import { InputTextarea } from 'primereact/inputtextarea';

const storageProviders = [
  { label: 'Yerel Depolama (Local)', value: 'Local' },
  { label: 'Amazon S3', value: 'AmazonS3' },
  { label: 'Azure Blob Storage', value: 'AzureBlob' },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingCloudFront, setSavingCloudFront] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingCloudFront, setTestingCloudFront] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<StorageConnectionTestResult | null>(null);
  const [cloudFrontTestResult, setCloudFrontTestResult] = useState<CloudFrontTestResult | null>(null);
  const [emailTestResult, setEmailTestResult] = useState<EmailTestResult | null>(null);
  const [awsRegions, setAwsRegions] = useState<AwsRegion[]>([]);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  const [settings, setSettings] = useState<StorageSettings>({
    provider: 'Local',
    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    awsBucketName: '',
    awsRegion: '',
    cdnBaseUrl: '',
    azureConnectionString: '',
    azureContainerName: '',
  });

  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    maxLessonNameLength: null,
    maxCourseNameLength: null,
    maxVideoDuration: null,
    maxDocumentSize: null,
    maxDescriptionLength: null,
  });

  const [cloudFrontSettings, setCloudFrontSettings] = useState<CloudFrontSettings>({
    isEnabled: false,
    domain: '',
    keyPairId: '',
    hasPrivateKey: false,
    urlExpirationMinutes: 120,
  });
  const [privateKeyPem, setPrivateKeyPem] = useState('');

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    isEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    hasPassword: false,
    fromAddress: '',
    fromName: '',
    useSsl: true,
    appUrl: '',
  });
  const [smtpPassword, setSmtpPassword] = useState('');

  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadSettings();
    loadAwsRegions();
    loadGeneralSettings();
    loadCloudFrontSettings();
    loadEmailSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get<ApiResponse<StorageSettings>>('/web/settings/storage');
      if (response.data?.data) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Settings load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAwsRegions = async () => {
    try {
      const response = await api.get<ApiResponse<AwsRegion[]>>('/web/settings/aws-regions');
      if (response.data?.data) {
        setAwsRegions(response.data.data);
      }
    } catch (error) {
      console.error('AWS regions load error:', error);
    }
  };

  const loadGeneralSettings = async () => {
    try {
      const response = await api.get<ApiResponse<GeneralSettings>>('/web/settings/general');
      if (response.data?.data) {
        setGeneralSettings(response.data.data);
      }
    } catch (error) {
      console.error('General settings load error:', error);
    }
  };

  const loadCloudFrontSettings = async () => {
    try {
      const response = await api.get<ApiResponse<CloudFrontSettings>>('/web/settings/cloudfront');
      if (response.data?.data) {
        setCloudFrontSettings(response.data.data);
      }
    } catch (error) {
      console.error('CloudFront settings load error:', error);
    }
  };

  const loadEmailSettings = async () => {
    try {
      const response = await api.get<ApiResponse<EmailSettings>>('/web/settings/email');
      if (response.data?.data) {
        setEmailSettings(response.data.data);
      }
    } catch (error) {
      console.error('Email settings load error:', error);
    }
  };

  const saveCloudFrontSettings = async () => {
    setSavingCloudFront(true);
    try {
      await api.put('/web/settings/cloudfront', {
        isEnabled: cloudFrontSettings.isEnabled,
        domain: cloudFrontSettings.domain,
        keyPairId: cloudFrontSettings.keyPairId,
        privateKeyPem: privateKeyPem || undefined,
        urlExpirationMinutes: cloudFrontSettings.urlExpirationMinutes,
      });
      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: 'CloudFront ayarlari kaydedildi',
      });
      setPrivateKeyPem(''); // Clear after save
      loadCloudFrontSettings(); // Reload to get updated hasPrivateKey
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: error.response?.data?.message || 'CloudFront ayarlari kaydedilemedi',
      });
    } finally {
      setSavingCloudFront(false);
    }
  };

  const testCloudFrontConfig = async () => {
    setTestingCloudFront(true);
    setCloudFrontTestResult(null);
    try {
      const response = await api.post<ApiResponse<CloudFrontTestResult>>('/web/settings/cloudfront/test');
      if (response.data?.data) {
        setCloudFrontTestResult(response.data.data);
      }
    } catch (error: any) {
      setCloudFrontTestResult({
        success: false,
        message: error.response?.data?.message || 'CloudFront testi basarisiz',
      });
    } finally {
      setTestingCloudFront(false);
    }
  };

  const saveEmailSettings = async () => {
    setSavingEmail(true);
    try {
      await api.put('/web/settings/email', {
        isEnabled: emailSettings.isEnabled,
        smtpHost: emailSettings.smtpHost,
        smtpPort: emailSettings.smtpPort,
        smtpUsername: emailSettings.smtpUsername,
        smtpPassword: smtpPassword || undefined,
        fromAddress: emailSettings.fromAddress,
        fromName: emailSettings.fromName,
        useSsl: emailSettings.useSsl,
        appUrl: emailSettings.appUrl,
      });
      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: 'E-posta ayarlari kaydedildi',
      });
      setSmtpPassword(''); // Clear after save
      loadEmailSettings(); // Reload to get updated hasPassword
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: error.response?.data?.message || 'E-posta ayarlari kaydedilemedi',
      });
    } finally {
      setSavingEmail(false);
    }
  };

  const testEmailConfig = async () => {
    if (!testEmailAddress) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyari',
        detail: 'Test e-posta adresi girin',
      });
      return;
    }
    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const response = await api.post<ApiResponse<EmailTestResult>>('/web/settings/email/test', {
        testEmailAddress,
        smtpHost: emailSettings.smtpHost,
        smtpPort: emailSettings.smtpPort,
        smtpUsername: emailSettings.smtpUsername,
        smtpPassword: smtpPassword || undefined,
        fromAddress: emailSettings.fromAddress,
        fromName: emailSettings.fromName,
        useSsl: emailSettings.useSsl,
      });
      if (response.data?.data) {
        setEmailTestResult(response.data.data);
      }
    } catch (error: any) {
      setEmailTestResult({
        success: false,
        message: error.response?.data?.message || 'E-posta testi basarisiz',
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const saveGeneralSettings = async () => {
    setSavingGeneral(true);
    try {
      await api.put('/web/settings/general', generalSettings);
      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: 'Genel ayarlar kaydedildi',
      });
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: error.response?.data?.message || 'Ayarlar kaydedilemedi',
      });
    } finally {
      setSavingGeneral(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/web/settings/storage', settings);
      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: 'Ayarlar kaydedildi',
      });
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: error.response?.data?.message || 'Ayarlar kaydedilemedi',
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await api.post<ApiResponse<StorageConnectionTestResult>>('/web/settings/storage/test-connection', {
        provider: settings.provider,
        awsAccessKeyId: settings.awsAccessKeyId,
        awsSecretAccessKey: settings.awsSecretAccessKey,
        awsBucketName: settings.awsBucketName,
        awsRegion: settings.awsRegion,
      });
      if (response.data?.data) {
        setTestResult(response.data.data);
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Baglanti testi basarisiz',
      });
    } finally {
      setTesting(false);
    }
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
        <h5 className="mb-4">Sistem Ayarlari</h5>

        <TabView>
          <TabPanel header="Depolama Ayarlari" leftIcon="pi pi-cloud mr-2">
            <div className="p-fluid">
              <div className="field mb-4">
                <label htmlFor="provider" className="font-bold">Depolama Saglayicisi</label>
                <Dropdown
                  id="provider"
                  value={settings.provider}
                  options={storageProviders}
                  onChange={(e) => setSettings({ ...settings, provider: e.value })}
                  placeholder="Saglayici secin"
                />
                <small className="text-500">
                  Dosyalarin nerede depolanacagini secin. S3 kullanmak icin AWS kimlik bilgilerini girin.
                </small>
              </div>

              {settings.provider === 'Local' && (
                <Message
                  severity="info"
                  text="Dosyalar sunucunun yerel diskinde depolanacak. Uretim ortami icin S3 veya Azure Blob onerilir."
                  className="mb-4"
                />
              )}

              {settings.provider === 'AmazonS3' && (
                <>
                <Card title="AWS S3 Ayarlari" className="mb-4">
                  <div className="grid">
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="awsAccessKeyId" className="font-bold">Access Key ID *</label>
                        <InputText
                          id="awsAccessKeyId"
                          value={settings.awsAccessKeyId || ''}
                          onChange={(e) => setSettings({ ...settings, awsAccessKeyId: e.target.value })}
                          placeholder="AKIAXXXXXXXXXXXXXXXX"
                        />
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="awsSecretAccessKey" className="font-bold">Secret Access Key *</label>
                        <InputText
                          id="awsSecretAccessKey"
                          type="password"
                          value={settings.awsSecretAccessKey || ''}
                          onChange={(e) => setSettings({ ...settings, awsSecretAccessKey: e.target.value })}
                          placeholder="Gizli anahtar"
                        />
                        <small className="text-500">Daha once kaydedilmisse maskelenmis olarak gorunur</small>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="awsBucketName" className="font-bold">Bucket Adi *</label>
                        <InputText
                          id="awsBucketName"
                          value={settings.awsBucketName || ''}
                          onChange={(e) => setSettings({ ...settings, awsBucketName: e.target.value })}
                          placeholder="my-bucket-name"
                        />
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="awsRegion" className="font-bold">Region *</label>
                        <Dropdown
                          id="awsRegion"
                          value={settings.awsRegion}
                          options={awsRegions}
                          onChange={(e) => setSettings({ ...settings, awsRegion: e.value })}
                          placeholder="Region secin"
                          filter
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="field">
                        <label htmlFor="cdnBaseUrl" className="font-bold">CDN URL (Opsiyonel)</label>
                        <InputText
                          id="cdnBaseUrl"
                          value={settings.cdnBaseUrl || ''}
                          onChange={(e) => setSettings({ ...settings, cdnBaseUrl: e.target.value })}
                          placeholder="https://cdn.example.com"
                        />
                        <small className="text-500">CloudFront veya baska bir CDN kullaniyorsaniz URL'yi girin</small>
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <div className="flex gap-2 align-items-center">
                    <Button
                      label="Baglanti Test Et"
                      icon="pi pi-check-circle"
                      severity="secondary"
                      onClick={testConnection}
                      loading={testing}
                    />
                    {testResult && (
                      <Message
                        severity={testResult.success ? 'success' : 'error'}
                        text={testResult.message || (testResult.success ? 'Baglanti basarili!' : 'Baglanti basarisiz')}
                      />
                    )}
                  </div>
                </Card>

                <Card title="AWS S3 Kurulum Rehberi" className="mb-4">
                  <div className="text-sm line-height-3">
                    <h6 className="mt-0 mb-3 text-primary">1. AWS Hesabi ve IAM Kullanici Olusturma</h6>
                    <ol className="mt-0 mb-4 pl-3">
                      <li className="mb-2">AWS Console'a giris yapin: <a href="https://console.aws.amazon.com" target="_blank" rel="noopener noreferrer" className="text-primary">console.aws.amazon.com</a></li>
                      <li className="mb-2"><strong>IAM</strong> servisine gidin</li>
                      <li className="mb-2"><strong>Users</strong> → <strong>Create user</strong></li>
                      <li className="mb-2">Kullanici adi girin (ornek: <code>egitim-platform-s3</code>)</li>
                      <li className="mb-2"><strong>Attach policies directly</strong> secin → <code>AmazonS3FullAccess</code> ekleyin</li>
                      <li className="mb-2">Kullaniciyi olusturun</li>
                      <li className="mb-2"><strong>Security credentials</strong> sekmesi → <strong>Create access key</strong></li>
                      <li className="mb-2"><strong>Application running outside AWS</strong> secin</li>
                      <li className="mb-2"><strong>Access Key ID</strong> ve <strong>Secret Access Key</strong>'i kaydedin</li>
                    </ol>

                    <h6 className="mb-3 text-primary">2. S3 Bucket Olusturma</h6>
                    <ol className="mt-0 mb-4 pl-3">
                      <li className="mb-2"><strong>S3</strong> servisine gidin</li>
                      <li className="mb-2"><strong>Create bucket</strong> tiklayin</li>
                      <li className="mb-2">Bucket adi girin (ornek: <code>egitim-platform-files</code>)</li>
                      <li className="mb-2">Region secin (ornek: <code>eu-central-1</code> - Frankfurt)</li>
                      <li className="mb-2"><strong>Block all public access</strong> → Acik birakin (guvenlik icin)</li>
                      <li className="mb-2">Bucket'i olusturun</li>
                    </ol>

                    <h6 className="mb-3 text-primary">3. CORS Yapilandirmasi</h6>
                    <ol className="mt-0 mb-4 pl-3">
                      <li className="mb-2">Bucket'a tiklayin → <strong>Permissions</strong> sekmesi</li>
                      <li className="mb-2"><strong>Cross-origin resource sharing (CORS)</strong> → Edit</li>
                      <li className="mb-2">Asagidaki JSON'u yapisitirin:</li>
                    </ol>
                    <pre className="surface-100 p-3 border-round text-xs overflow-auto">{`[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]`}</pre>

                    <h6 className="mb-3 mt-4 text-primary">4. Bucket Policy (Opsiyonel - CloudFront icin)</h6>
                    <p className="mt-0 mb-2">CloudFront kullaniyorsaniz, bucket'a sadece CloudFront'un erismesi icin:</p>
                    <ol className="mt-0 mb-4 pl-3">
                      <li className="mb-2"><strong>Permissions</strong> → <strong>Bucket policy</strong> → Edit</li>
                      <li className="mb-2">CloudFront OAC (Origin Access Control) policy'sini ekleyin</li>
                    </ol>

                    <h6 className="mb-3 text-primary">5. Klasor Yapisi (Onerilen)</h6>
                    <pre className="surface-100 p-3 border-round text-xs overflow-auto">{`bucket-name/
├── videos/          # Kurs videolari
│   └── course-{id}/
│       └── lesson-{id}.mp4
├── documents/       # PDF, dokumanlar
├── images/          # Kurs gorselleri, thumbnails
│   ├── courses/
│   └── avatars/
└── raw/             # Islenmemis dosyalar`}</pre>
                  </div>
                </Card>
                </>
              )}

              {settings.provider === 'AzureBlob' && (
                <Card title="Azure Blob Storage Ayarlari" className="mb-4">
                  <Message
                    severity="warn"
                    text="Azure Blob Storage destegi yakinda eklenecek."
                    className="mb-3"
                  />
                  <div className="grid">
                    <div className="col-12">
                      <div className="field">
                        <label htmlFor="azureConnectionString" className="font-bold">Connection String</label>
                        <InputText
                          id="azureConnectionString"
                          type="password"
                          value={settings.azureConnectionString || ''}
                          onChange={(e) => setSettings({ ...settings, azureConnectionString: e.target.value })}
                          placeholder="DefaultEndpointsProtocol=https;..."
                          disabled
                        />
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="azureContainerName" className="font-bold">Container Adi</label>
                        <InputText
                          id="azureContainerName"
                          value={settings.azureContainerName || ''}
                          onChange={(e) => setSettings({ ...settings, azureContainerName: e.target.value })}
                          placeholder="my-container"
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex justify-content-end mt-4">
                <Button
                  label="Ayarlari Kaydet"
                  icon="pi pi-save"
                  onClick={saveSettings}
                  loading={saving}
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="Genel Ayarlar" leftIcon="pi pi-cog mr-2">
            <div className="p-fluid">
              <Message
                severity="info"
                text="Bu ayarlar kurs ve ders olusturma sirasinda dogrulama icin kullanilir. Bos birakilirsa sinir uygulanmaz."
                className="mb-4"
              />

              <div className="grid">
                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="maxCourseNameLength" className="font-bold">Maksimum Kurs Adi Uzunlugu</label>
                    <InputNumber
                      id="maxCourseNameLength"
                      value={generalSettings.maxCourseNameLength}
                      onValueChange={(e) => setGeneralSettings({ ...generalSettings, maxCourseNameLength: e.value })}
                      min={10}
                      max={500}
                      placeholder="Sinir yok"
                      showButtons
                    />
                    <small className="text-500">Karakter sayisi (ornek: 100)</small>
                  </div>
                </div>

                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="maxLessonNameLength" className="font-bold">Maksimum Ders Adi Uzunlugu</label>
                    <InputNumber
                      id="maxLessonNameLength"
                      value={generalSettings.maxLessonNameLength}
                      onValueChange={(e) => setGeneralSettings({ ...generalSettings, maxLessonNameLength: e.value })}
                      min={10}
                      max={500}
                      placeholder="Sinir yok"
                      showButtons
                    />
                    <small className="text-500">Karakter sayisi (ornek: 150)</small>
                  </div>
                </div>

                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="maxDescriptionLength" className="font-bold">Maksimum Aciklama Uzunlugu</label>
                    <InputNumber
                      id="maxDescriptionLength"
                      value={generalSettings.maxDescriptionLength}
                      onValueChange={(e) => setGeneralSettings({ ...generalSettings, maxDescriptionLength: e.value })}
                      min={50}
                      max={10000}
                      placeholder="Sinir yok"
                      showButtons
                    />
                    <small className="text-500">Karakter sayisi (ornek: 2000)</small>
                  </div>
                </div>

                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="maxVideoDuration" className="font-bold">Maksimum Video Suresi</label>
                    <InputNumber
                      id="maxVideoDuration"
                      value={generalSettings.maxVideoDuration}
                      onValueChange={(e) => setGeneralSettings({ ...generalSettings, maxVideoDuration: e.value })}
                      min={1}
                      max={600}
                      placeholder="Sinir yok"
                      showButtons
                      suffix=" dakika"
                    />
                    <small className="text-500">Dakika cinsinden (ornek: 60)</small>
                  </div>
                </div>

                <div className="col-12 md:col-6">
                  <div className="field">
                    <label htmlFor="maxDocumentSize" className="font-bold">Maksimum Dokuman Boyutu</label>
                    <InputNumber
                      id="maxDocumentSize"
                      value={generalSettings.maxDocumentSize}
                      onValueChange={(e) => setGeneralSettings({ ...generalSettings, maxDocumentSize: e.value })}
                      min={1}
                      max={500}
                      placeholder="Sinir yok"
                      showButtons
                      suffix=" MB"
                    />
                    <small className="text-500">Megabayt cinsinden (ornek: 50)</small>
                  </div>
                </div>
              </div>

              <Divider />

              <div className="flex justify-content-end gap-2">
                <Button
                  label="Varsayilana Sifirla"
                  icon="pi pi-refresh"
                  severity="secondary"
                  onClick={() => setGeneralSettings({
                    maxLessonNameLength: null,
                    maxCourseNameLength: null,
                    maxVideoDuration: null,
                    maxDocumentSize: null,
                    maxDescriptionLength: null,
                  })}
                />
                <Button
                  label="Ayarlari Kaydet"
                  icon="pi pi-save"
                  onClick={saveGeneralSettings}
                  loading={savingGeneral}
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="CloudFront (Video CDN)" leftIcon="pi pi-video mr-2">
            <div className="p-fluid">
              <Message
                severity="info"
                text="CloudFront signed URL'ler, videolarin sadece yetkili kullanicilar tarafindan izlenmesini saglar. URL'ler belirli bir sure sonra gecersiz olur."
                className="mb-4"
              />

              <div className="field mb-4">
                <div className="flex align-items-center gap-2">
                  <InputSwitch
                    checked={cloudFrontSettings.isEnabled}
                    onChange={(e) => setCloudFrontSettings({ ...cloudFrontSettings, isEnabled: e.value })}
                  />
                  <label className="font-bold">CloudFront Signed URL Aktif</label>
                </div>
                <small className="text-500 block mt-2">
                  Aktif edildiginde videolar icin imzali URL olusturulur. Devre disi birakilirsa orijinal URL kullanilir.
                </small>
              </div>

              {cloudFrontSettings.isEnabled && (
                <Card title="CloudFront Ayarlari" className="mb-4">
                  <div className="grid">
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="cfDomain" className="font-bold">CloudFront Domain *</label>
                        <InputText
                          id="cfDomain"
                          value={cloudFrontSettings.domain || ''}
                          onChange={(e) => setCloudFrontSettings({ ...cloudFrontSettings, domain: e.target.value })}
                          placeholder="d1234xyz.cloudfront.net"
                        />
                        <small className="text-500">CloudFront distribution domain adresi</small>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="cfKeyPairId" className="font-bold">Key Pair ID *</label>
                        <InputText
                          id="cfKeyPairId"
                          value={cloudFrontSettings.keyPairId || ''}
                          onChange={(e) => setCloudFrontSettings({ ...cloudFrontSettings, keyPairId: e.target.value })}
                          placeholder="K2XXXXXXXXXX"
                        />
                        <small className="text-500">AWS CloudFront Key Pair ID (K ile baslar)</small>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="cfExpiration" className="font-bold">URL Gecerlilik Suresi</label>
                        <InputNumber
                          id="cfExpiration"
                          value={cloudFrontSettings.urlExpirationMinutes}
                          onValueChange={(e) => setCloudFrontSettings({ ...cloudFrontSettings, urlExpirationMinutes: e.value || 120 })}
                          min={5}
                          max={1440}
                          showButtons
                          suffix=" dakika"
                        />
                        <small className="text-500">Signed URL'nin gecerli olacagi sure (5-1440 dakika)</small>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label className="font-bold">Private Key Durumu</label>
                        <div className="mt-2">
                          {cloudFrontSettings.hasPrivateKey ? (
                            <Message severity="success" text="Private key tanimli" />
                          ) : (
                            <Message severity="warn" text="Private key tanimli degil" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="field">
                        <label htmlFor="cfPrivateKey" className="font-bold">
                          RSA Private Key (PEM) {cloudFrontSettings.hasPrivateKey ? '(Degistirmek icin girin)' : '*'}
                        </label>
                        <InputTextarea
                          id="cfPrivateKey"
                          value={privateKeyPem}
                          onChange={(e) => setPrivateKeyPem(e.target.value)}
                          rows={6}
                          placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                          style={{ fontFamily: 'monospace', fontSize: '12px' }}
                        />
                        <small className="text-500">
                          cloudfront-private-key.pem dosyasinin icerigini yapisitirin. Mevcut anahtari korumak icin bos birakin.
                        </small>
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <div className="flex gap-2 align-items-center flex-wrap">
                    <Button
                      label="Yapilandirmayi Test Et"
                      icon="pi pi-check-circle"
                      severity="secondary"
                      onClick={testCloudFrontConfig}
                      loading={testingCloudFront}
                    />
                    {cloudFrontTestResult && (
                      <Message
                        severity={cloudFrontTestResult.success ? 'success' : 'error'}
                        text={cloudFrontTestResult.message || (cloudFrontTestResult.success ? 'Yapilandirma basarili!' : 'Yapilandirma hatali')}
                      />
                    )}
                  </div>

                  {cloudFrontTestResult?.success && cloudFrontTestResult.testSignedUrl && (
                    <div className="mt-3 p-3 surface-100 border-round">
                      <small className="font-bold block mb-2">Test Signed URL:</small>
                      <code className="text-xs break-all">{cloudFrontTestResult.testSignedUrl}</code>
                    </div>
                  )}
                </Card>
              )}

              <Divider />

              <Card title="AWS CloudFront Kurulum Adımlari" className="mb-4">
                <ol className="line-height-3 text-sm">
                  <li className="mb-2">AWS Console &gt; CloudFront &gt; Key management &gt; Public keys</li>
                  <li className="mb-2">RSA key pair olusturun: <code>openssl genrsa -out cloudfront-private-key.pem 2048</code></li>
                  <li className="mb-2">Public key cikarın: <code>openssl rsa -pubout -in cloudfront-private-key.pem -out cloudfront-public-key.pem</code></li>
                  <li className="mb-2">Public key'i AWS'e yukleyin ve Key ID'yi not alin</li>
                  <li className="mb-2">Key Groups olusturun ve public key'i ekleyin</li>
                  <li className="mb-2">CloudFront Distribution &gt; Behaviors &gt; Restrict viewer access: Yes</li>
                  <li className="mb-2">Trusted key groups: olusturdugunuz key group'u secin</li>
                  <li>Private key'i yukaridaki alana yapisitirin</li>
                </ol>
              </Card>

              <div className="flex justify-content-end mt-4">
                <Button
                  label="Ayarlari Kaydet"
                  icon="pi pi-save"
                  onClick={saveCloudFrontSettings}
                  loading={savingCloudFront}
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel header="E-posta Ayarlari" leftIcon="pi pi-envelope mr-2">
            <div className="p-fluid">
              <Message
                severity="info"
                text="E-posta ayarlari, sifre sifirlama ve bildirim e-postalari gondermek icin kullanilir. SMTP sunucunuzun bilgilerini girin."
                className="mb-4"
              />

              <div className="field mb-4">
                <div className="flex align-items-center gap-2">
                  <InputSwitch
                    checked={emailSettings.isEnabled}
                    onChange={(e) => setEmailSettings({ ...emailSettings, isEnabled: e.value })}
                  />
                  <label className="font-bold">E-posta Servisi Aktif</label>
                </div>
                <small className="text-500 block mt-2">
                  Devre disi birakilirsa e-posta gonderimi yapilmaz. Sifre sifirlama tokeni olusturulur ancak e-posta gonderilmez.
                </small>
              </div>

              {emailSettings.isEnabled && (
                <Card title="SMTP Ayarlari" className="mb-4">
                  <div className="grid">
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="smtpHost" className="font-bold">SMTP Sunucu *</label>
                        <InputText
                          id="smtpHost"
                          value={emailSettings.smtpHost || ''}
                          onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                          placeholder="smtp.gmail.com"
                        />
                        <small className="text-500">SMTP sunucu adresi</small>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="smtpPort" className="font-bold">Port *</label>
                        <InputNumber
                          id="smtpPort"
                          value={emailSettings.smtpPort}
                          onValueChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.value || 587 })}
                          min={1}
                          max={65535}
                          showButtons
                        />
                        <small className="text-500">587 (TLS) veya 465 (SSL) onerilir</small>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="smtpUsername" className="font-bold">Kullanici Adi *</label>
                        <InputText
                          id="smtpUsername"
                          value={emailSettings.smtpUsername || ''}
                          onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
                          placeholder="user@example.com"
                        />
                        <small className="text-500">Genellikle e-posta adresi</small>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="smtpPassword" className="font-bold">
                          Sifre {emailSettings.hasPassword ? '(Degistirmek icin girin)' : '*'}
                        </label>
                        <InputText
                          id="smtpPassword"
                          type="password"
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                          placeholder={emailSettings.hasPassword ? '********' : 'SMTP sifresi'}
                        />
                        <small className="text-500">
                          {emailSettings.hasPassword ? 'Mevcut sifreyi korumak icin bos birakin' : 'Uygulama sifresi kullanin (2FA aktifse)'}
                        </small>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="fromAddress" className="font-bold">Gonderici E-posta *</label>
                        <InputText
                          id="fromAddress"
                          type="email"
                          value={emailSettings.fromAddress || ''}
                          onChange={(e) => setEmailSettings({ ...emailSettings, fromAddress: e.target.value })}
                          placeholder="noreply@example.com"
                        />
                        <small className="text-500">E-postalarin gonderilecegi adres</small>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="fromName" className="font-bold">Gonderici Adi</label>
                        <InputText
                          id="fromName"
                          value={emailSettings.fromName || ''}
                          onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                          placeholder="Education Platform"
                        />
                        <small className="text-500">E-postalarda gorunecek isim</small>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="appUrl" className="font-bold">Uygulama URL *</label>
                        <InputText
                          id="appUrl"
                          value={emailSettings.appUrl || ''}
                          onChange={(e) => setEmailSettings({ ...emailSettings, appUrl: e.target.value })}
                          placeholder="https://admin.example.com"
                        />
                        <small className="text-500">Sifre sifirlama linkleri icin kullanilir</small>
                      </div>
                    </div>
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label className="font-bold block mb-2">SSL/TLS Kullan</label>
                        <InputSwitch
                          checked={emailSettings.useSsl}
                          onChange={(e) => setEmailSettings({ ...emailSettings, useSsl: e.value })}
                        />
                        <small className="text-500 block mt-2">Guvenli baglanti icin aktif tutun</small>
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <div className="grid">
                    <div className="col-12 md:col-6">
                      <div className="field">
                        <label htmlFor="testEmail" className="font-bold">Test E-posta Adresi</label>
                        <div className="p-inputgroup">
                          <InputText
                            id="testEmail"
                            type="email"
                            value={testEmailAddress}
                            onChange={(e) => setTestEmailAddress(e.target.value)}
                            placeholder="test@example.com"
                          />
                          <Button
                            label="Test Gonder"
                            icon="pi pi-send"
                            severity="secondary"
                            onClick={testEmailConfig}
                            loading={testingEmail}
                          />
                        </div>
                        <small className="text-500">Yapilandirmayi test etmek icin bir e-posta adresi girin</small>
                      </div>
                    </div>
                    <div className="col-12 md:col-6 flex align-items-center">
                      {emailTestResult && (
                        <Message
                          severity={emailTestResult.success ? 'success' : 'error'}
                          text={emailTestResult.message || (emailTestResult.success ? 'E-posta gonderildi!' : 'Gonderim basarisiz')}
                          className="w-full"
                        />
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {emailSettings.isEnabled && (
                <Card title="Yaygin SMTP Ayarlari" className="mb-4">
                  <div className="grid">
                    <div className="col-12 md:col-4">
                      <h6 className="mt-0 text-primary">Gmail</h6>
                      <ul className="text-sm pl-3 line-height-3">
                        <li>Sunucu: <code>smtp.gmail.com</code></li>
                        <li>Port: <code>587</code> (TLS)</li>
                        <li>SSL: Aktif</li>
                        <li>2FA varsa: Uygulama sifresi kullanin</li>
                      </ul>
                    </div>
                    <div className="col-12 md:col-4">
                      <h6 className="mt-0 text-primary">AWS SES</h6>
                      <ul className="text-sm pl-3 line-height-3">
                        <li>Sunucu: <code>email-smtp.eu-west-1.amazonaws.com</code></li>
                        <li>Port: <code>587</code></li>
                        <li>SSL: Aktif</li>
                        <li>IAM SMTP kimlik bilgileri kullanin</li>
                      </ul>
                    </div>
                    <div className="col-12 md:col-4">
                      <h6 className="mt-0 text-primary">SendGrid</h6>
                      <ul className="text-sm pl-3 line-height-3">
                        <li>Sunucu: <code>smtp.sendgrid.net</code></li>
                        <li>Port: <code>587</code></li>
                        <li>Kullanici: <code>apikey</code></li>
                        <li>Sifre: API anahtariniz</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex justify-content-end mt-4">
                <Button
                  label="Ayarlari Kaydet"
                  icon="pi pi-save"
                  onClick={saveEmailSettings}
                  loading={savingEmail}
                  disabled={!emailSettings.isEnabled}
                />
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </AdminLayout>
  );
}
