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
import { StorageSettings, AwsRegion, StorageConnectionTestResult, GeneralSettings } from '@/types';

const storageProviders = [
  { label: 'Yerel Depolama (Local)', value: 'Local' },
  { label: 'Amazon S3', value: 'AmazonS3' },
  { label: 'Azure Blob Storage', value: 'AzureBlob' },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<StorageConnectionTestResult | null>(null);
  const [awsRegions, setAwsRegions] = useState<AwsRegion[]>([]);

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

  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadSettings();
    loadAwsRegions();
    loadGeneralSettings();
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

          <TabPanel header="E-posta Ayarlari" leftIcon="pi pi-envelope mr-2">
            <Message
              severity="info"
              text="E-posta ayarlari bolumu yakinda eklenecek."
            />
          </TabPanel>
        </TabView>
      </div>
    </AdminLayout>
  );
}
