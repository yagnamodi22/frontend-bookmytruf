import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';
import { siteSettingsService } from '../services/siteSettingsService';
import { useEffect, useState } from 'react';

const Contact = () => {
  const [settings, setSettings] = useState({});
  useEffect(() => {
    const load = async () => {
      try {
        const map = await siteSettingsService.getMap();
        setSettings(map || {});
      } catch {}
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h1>
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
              <span className="text-gray-700">{settings.contact_address || '123, Sports Complex, Visnagar'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">{settings.contact_phone || '+91 98765 43210'}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-green-600" />
              <a href={`mailto:${settings.contact_email || 'info@bookmyturf.com'}`} className="text-green-700 hover:text-green-800">
                {settings.contact_email || 'info@bookmyturf.com'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;


