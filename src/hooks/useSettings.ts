'use client';

import { useState, useEffect } from 'react';

export interface SiteSettings {
  storeName: string;
  storeNameEn: string;
  phone: string;
  phone2: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
  workingHoursWeekdays: string;
  workingHoursFriday: string;
  mapEmbedUrl: string;
  twitter: string;
  youtube: string;
  terms_content: string;
  privacy_content: string;
}

const defaultSettings: SiteSettings = {
  storeName: 'كمال سعد',
  storeNameEn: 'Kamal Saad',
  phone: '+20 100 123 4567',
  phone2: '',
  email: 'info@kamalsaad.com',
  address: 'القاهرة، مصر',
  facebook: '',
  instagram: '',
  whatsapp: '',
  workingHoursWeekdays: 'السبت - الخميس: 9:00 صباحاً - 9:00 مساءً',
  workingHoursFriday: 'الجمعة: 2:00 مساءً - 9:00 مساءً',
  mapEmbedUrl: '',
  twitter: '',
  youtube: '',
  terms_content: '',
  privacy_content: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      
      if (data.success && data.settings) {
        setSettings(prev => ({
          ...prev,
          storeName: data.settings.storeName || prev.storeName,
          storeNameEn: data.settings.storeNameEn || prev.storeNameEn,
          phone: data.settings.phone || prev.phone,
          phone2: data.settings.phone2 || '',
          email: data.settings.email || prev.email,
          address: data.settings.address || prev.address,
          facebook: data.settings.facebook || '',
          instagram: data.settings.instagram || '',
          whatsapp: data.settings.whatsapp || '',
          workingHoursWeekdays: data.settings.workingHoursWeekdays || prev.workingHoursWeekdays,
          workingHoursFriday: data.settings.workingHoursFriday || prev.workingHoursFriday,
          mapEmbedUrl: data.settings.mapEmbedUrl || '',
          twitter: data.settings.twitter || '',
          youtube: data.settings.youtube || '',
          terms_content: data.settings.terms_content || '',
          privacy_content: data.settings.privacy_content || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refetch: fetchSettings };
}
