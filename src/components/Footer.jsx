import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram } from 'lucide-react';
import { siteSettingsService } from '../services/siteSettingsService';

const Footer = () => {
  const [settings, setSettings] = useState({});
  useEffect(() => {
    const load = async () => {
      try {
        const map = await siteSettingsService.getMap();
        setSettings(map || {});
      } catch {}
    };
    load();
    const handler = () => load();
    window.addEventListener('site-settings-updated', handler);
    return () => window.removeEventListener('site-settings-updated', handler);
  }, []);
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">BT</span>
                </div>
              )}
              <span className="text-xl font-bold">{settings.site_name || 'BookMyTurf'}</span>
            </div>
            <p className="text-gray-400">
              Your one-stop solution for booking sports turfs in Visnagar. 
              Play your favorite sport with ease!
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 text-gray-400 hover:text-green-400 cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-gray-400 hover:text-green-400 cursor-pointer transition-colors" />
              <Instagram className="w-5 h-5 text-gray-400 hover:text-green-400 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-400 hover:text-green-400 transition-colors">Home</a></li>
              <li><a href="/turfs" className="text-gray-400 hover:text-green-400 transition-colors">All Turfs</a></li>
              <li><a href="/about" className="text-gray-400 hover:text-green-400 transition-colors">About Us</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-green-400 transition-colors">Contact</a></li>
              
            </ul>
          </div>

          {/* Sports */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sports Available</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">Football</li>
              <li className="text-gray-400">Cricket</li>
              <li className="text-gray-400">Basketball</li>
              <li className="text-gray-400">Badminton</li>
              <li className="text-gray-400">Tennis</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-green-400 mt-0.5" />
                <span className="text-gray-400">{settings.contact_address || '123, Sports Complex, Visnagar'}</span>

              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-green-400" />
                <span className="text-gray-400">{settings.contact_phone || '+91 63536 57236'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-green-400" />
                <span className="text-gray-400">{settings.contact_email || 'bookmytruf@gmail.com'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 {settings.site_name || 'BookMyTurf'}. All rights reserved. | Developed for College Project
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;