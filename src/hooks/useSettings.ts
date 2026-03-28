'use client';

import { useState, useEffect } from 'react';

export interface SiteSettings {
  storeName: string;
  storeNameEn: string;
  phone: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
}

const defaultSettings: SiteSettings = {
  storeName: 'كمال سعد',
  storeNameEn: 'Kamal Saad',
  phone: '+20 100 123 4567',
  email: 'info@kamalsaad.com',
  address: 'القاهرة، مصر',
  facebook: '',
  instagram: '',
  whatsapp: '',
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
          email: data.settings.email || prev.email,
          address: data.settings.address || prev.address,
          facebook: data.settings.facebook || '',
          instagram: data.settings.instagram || '',
          whatsapp: data.settings.whatsapp || '',
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
