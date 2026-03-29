'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin, Phone, Mail, Clock, Send, Facebook, Instagram, MessageCircle,
  Loader2, CheckCircle2, AlertCircle, ArrowLeft
} from 'lucide-react';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/store/useStore';
import { useSettings } from '@/hooks/useSettings';

// Contact page translations
const contactTranslations = {
  ar: {
    pageTitle: 'تواصل معنا',
    pageSubtitle: 'نحن هنا لمساعدتك. تواصل معنا وسنرد عليك في أقرب وقت ممكن.',
    formTitle: 'أرسل رسالة',
    nameLabel: 'الاسم',
    namePlaceholder: 'أدخل اسمك الكامل',
    nameRequired: 'الاسم مطلوب',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'example@email.com',
    emailRequired: 'البريد الإلكتروني مطلوب',
    emailInvalid: 'البريد الإلكتروني غير صالح',
    phoneLabel: 'رقم الهاتف',
    phonePlaceholder: '+20 xxx xxx xxxx',
    phoneOptional: '(اختياري)',
    subjectLabel: 'الموضوع',
    subjectPlaceholder: 'اختر موضوع الرسالة',
    subjectGeneral: 'استفسار عام',
    subjectOrder: 'استفسار عن طلب',
    subjectReturn: 'استرجاع أو استبدال',
    subjectSuggestion: 'اقتراح',
    subjectComplaint: 'شكوى',
    messageLabel: 'الرسالة',
    messagePlaceholder: 'اكتب رسالتك هنا...',
    messageRequired: 'الرسالة مطلوبة',
    messageMinLength: 'يجب أن تكون الرسالة 10 أحرف على الأقل',
    submitButton: 'إرسال الرسالة',
    submitting: 'جاري الإرسال...',
    successTitle: 'تم الإرسال بنجاح!',
    successMessage: 'شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.',
    errorTitle: 'حدث خطأ',
    errorMessage: 'لم نتمكن من إرسال رسالتك. يرجى المحاولة مرة أخرى.',
    contactInfoTitle: 'معلومات التواصل',
    addressLabel: 'العنوان',
    addressValue: '123 شارع التحرير، وسط البلد، القاهرة، مصر',
    phoneLabel2: 'الهاتف',
    phoneValue1: '+20 100 123 4567',
    phoneValue2: '+20 2 1234 5678',
    emailLabel2: 'البريد الإلكتروني',
    emailValue: 'info@kamalsaad.com',
    workingHoursTitle: 'ساعات العمل',
    workingHoursWeekdays: 'السبت - الخميس',
    workingHoursWeekdaysTime: '9:00 صباحاً - 9:00 مساءً',
    workingHoursFriday: 'الجمعة',
    workingHoursFridayTime: '2:00 مساءً - 9:00 مساءً',
    mapTitle: 'موقعنا',
    socialTitle: 'تابعنا على',
    backToHome: 'العودة للرئيسية',
    openInMaps: 'فتح في خرائط جوجل',
    sendAnother: 'إرسال رسالة أخرى',
  },
  en: {
    pageTitle: 'Contact Us',
    pageSubtitle: "We're here to help. Contact us and we'll get back to you as soon as possible.",
    formTitle: 'Send a Message',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your full name',
    nameRequired: 'Name is required',
    emailLabel: 'Email',
    emailPlaceholder: 'example@email.com',
    emailRequired: 'Email is required',
    emailInvalid: 'Invalid email format',
    phoneLabel: 'Phone Number',
    phonePlaceholder: '+20 xxx xxx xxxx',
    phoneOptional: '(optional)',
    subjectLabel: 'Subject',
    subjectPlaceholder: 'Select message subject',
    subjectGeneral: 'General Inquiry',
    subjectOrder: 'Order Inquiry',
    subjectReturn: 'Return/Exchange',
    subjectSuggestion: 'Suggestion',
    subjectComplaint: 'Complaint',
    messageLabel: 'Message',
    messagePlaceholder: 'Write your message here...',
    messageRequired: 'Message is required',
    messageMinLength: 'Message must be at least 10 characters',
    submitButton: 'Send Message',
    submitting: 'Sending...',
    successTitle: 'Message Sent!',
    successMessage: 'Thank you for contacting us. We will get back to you as soon as possible.',
    errorTitle: 'Error',
    errorMessage: 'Could not send your message. Please try again.',
    contactInfoTitle: 'Contact Information',
    addressLabel: 'Address',
    addressValue: '123 Tahrir Street, Downtown, Cairo, Egypt',
    phoneLabel2: 'Phone',
    phoneValue1: '+20 100 123 4567',
    phoneValue2: '+20 2 1234 5678',
    emailLabel2: 'Email',
    emailValue: 'info@kamalsaad.com',
    workingHoursTitle: 'Working Hours',
    workingHoursWeekdays: 'Saturday - Thursday',
    workingHoursWeekdaysTime: '9:00 AM - 9:00 PM',
    workingHoursFriday: 'Friday',
    workingHoursFridayTime: '2:00 PM - 9:00 PM',
    mapTitle: 'Our Location',
    socialTitle: 'Follow Us',
    backToHome: 'Back to Home',
    openInMaps: 'Open in Google Maps',
    sendAnother: 'Send Another Message',
  },
};

// Subject options
const subjectOptions = [
  { value: 'general', key: 'subjectGeneral' },
  { value: 'order', key: 'subjectOrder' },
  { value: 'return', key: 'subjectReturn' },
  { value: 'suggestion', key: 'subjectSuggestion' },
  { value: 'complaint', key: 'subjectComplaint' },
] as const;

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactPage() {
  const { language } = useStore();
  const { toast } = useToast();
  const { settings } = useSettings();
  const isArabic = language === 'ar';
  const t = contactTranslations[language];

  // Override contact info from settings
  const displayAddress = settings.address || t.addressValue;
  const displayPhone = settings.phone || t.phoneValue1;
  const displayEmail = settings.email || t.emailValue;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t.nameRequired;
    }

    if (!formData.email.trim()) {
      newErrors.email = t.emailRequired;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t.emailInvalid;
    }

    if (!formData.message.trim()) {
      newErrors.message = t.messageRequired;
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t.messageMinLength;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: t.successTitle,
          description: t.successMessage,
        });
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      } else {
        throw new Error(result.error || t.errorMessage);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t.errorTitle,
        description: t.errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Social media links from settings
  const socialLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      href: settings.facebook || 'https://facebook.com/kamalsaad',
      color: 'hover:bg-blue-600',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      href: settings.instagram || 'https://instagram.com/kamalsaad',
      color: 'hover:bg-pink-600',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}` : 'https://wa.me/201001234567',
      color: 'hover:bg-green-600',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-l from-teal-600 to-cyan-600 py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-white"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.pageTitle}</h1>
              <p className="text-xl text-teal-100 max-w-2xl mx-auto">{t.pageSubtitle}</p>
              
              <Link href="/">
                <Button
                  variant="outline"
                  className="mt-6 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  {isArabic ? <ArrowLeft className="h-4 w-4 ml-2 rotate-180" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
                  {t.backToHome}
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2"
              >
                <Card className="shadow-xl border-0 bg-white dark:bg-gray-800">
                  <CardHeader className="bg-gradient-to-l from-teal-500 to-cyan-500 text-white rounded-t-xl">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      {t.formTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isSuccess ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                      >
                        <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {t.successTitle}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{t.successMessage}</p>
                        <Button
                          onClick={() => setIsSuccess(false)}
                          className="bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                        >
                          {t.sendAnother}
                        </Button>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name Field */}
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                            {t.nameLabel} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder={t.namePlaceholder}
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className={`bg-gray-50 dark:bg-gray-700 border-2 ${
                              errors.name
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-gray-200 dark:border-gray-600 focus:border-teal-500'
                            } ${isArabic ? 'text-right' : 'text-left'}`}
                          />
                          {errors.name && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {errors.name}
                            </p>
                          )}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                            {t.emailLabel} <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder={t.emailPlaceholder}
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className={`bg-gray-50 dark:bg-gray-700 border-2 ${
                              errors.email
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-gray-200 dark:border-gray-600 focus:border-teal-500'
                            } ${isArabic ? 'text-right' : 'text-left'}`}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {errors.email}
                            </p>
                          )}
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">
                            {t.phoneLabel}{' '}
                            <span className="text-gray-400 dark:text-gray-500 text-sm">{t.phoneOptional}</span>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder={t.phonePlaceholder}
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className={`bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 focus:border-teal-500 ${
                              isArabic ? 'text-right' : 'text-left'
                            }`}
                          />
                        </div>

                        {/* Subject Field */}
                        <div className="space-y-2">
                          <Label htmlFor="subject" className="text-gray-700 dark:text-gray-300">
                            {t.subjectLabel}
                          </Label>
                          <Select
                            value={formData.subject}
                            onValueChange={(value) => handleChange('subject', value)}
                          >
                            <SelectTrigger
                              id="subject"
                              className={`bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 focus:border-teal-500 w-full ${
                                isArabic ? 'text-right' : 'text-left'
                              }`}
                            >
                              <SelectValue placeholder={t.subjectPlaceholder} />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-700">
                              {subjectOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {t[option.key]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Message Field */}
                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-gray-700 dark:text-gray-300">
                            {t.messageLabel} <span className="text-red-500">*</span>
                          </Label>
                          <Textarea
                            id="message"
                            placeholder={t.messagePlaceholder}
                            value={formData.message}
                            onChange={(e) => handleChange('message', e.target.value)}
                            rows={5}
                            className={`bg-gray-50 dark:bg-gray-700 border-2 ${
                              errors.message
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-gray-200 dark:border-gray-600 focus:border-teal-500'
                            } ${isArabic ? 'text-right' : 'text-left'} resize-none`}
                          />
                          {errors.message && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {errors.message}
                            </p>
                          )}
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-12 bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span className="mr-2">{t.submitting}</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-5 w-5" />
                              <span className={isArabic ? 'mr-2' : 'ml-2'}>{t.submitButton}</span>
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* Contact Info Card */}
                <Card className="shadow-xl border-0 bg-white dark:bg-gray-800">
                  <CardHeader className="bg-gradient-to-l from-teal-500 to-cyan-500 text-white rounded-t-xl">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      {t.contactInfoTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Address */}
                    <div className={`flex items-start gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <div className="h-12 w-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className={isArabic ? 'text-right' : 'text-left'}>
                        <p className="font-semibold text-gray-900 dark:text-white">{t.addressLabel}</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{displayAddress}</p>
                      </div>
                    </div>

                    {/* Phone Numbers */}
                    <div className={`flex items-start gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <div className="h-12 w-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className={isArabic ? 'text-right' : 'text-left'}>
                        <p className="font-semibold text-gray-900 dark:text-white">{t.phoneLabel2}</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{displayPhone}</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className={`flex items-start gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <div className="h-12 w-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className={isArabic ? 'text-right' : 'text-left'}>
                        <p className="font-semibold text-gray-900 dark:text-white">{t.emailLabel2}</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{displayEmail}</p>
                      </div>
                    </div>

                    {/* Working Hours */}
                    <div className={`flex items-start gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <div className="h-12 w-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className={isArabic ? 'text-right' : 'text-left'}>
                        <p className="font-semibold text-gray-900 dark:text-white">{t.workingHoursTitle}</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {t.workingHoursWeekdays}: {t.workingHoursWeekdaysTime}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {t.workingHoursFriday}: {t.workingHoursFridayTime}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media Links */}
                <Card className="shadow-xl border-0 bg-white dark:bg-gray-800">
                  <CardHeader className="bg-gradient-to-l from-teal-500 to-cyan-500 text-white rounded-t-xl">
                    <CardTitle className="text-xl">{t.socialTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex gap-4 justify-center">
                      {socialLinks.map((social) => (
                        <motion.a
                          key={social.name}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1, y: -4 }}
                          whileTap={{ scale: 0.95 }}
                          className={`h-14 w-14 bg-gray-100 dark:bg-gray-700 ${social.color} hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg`}
                        >
                          <social.icon className="h-7 w-7" />
                        </motion.a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Map Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12"
            >
              <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 overflow-hidden">
                <CardHeader className="bg-gradient-to-l from-teal-500 to-cyan-500 text-white">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {t.mapTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative h-[400px] w-full bg-gray-200 dark:bg-gray-700">
                    {/* Static Map Image - Using a placeholder map */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-gray-700 dark:to-gray-800">
                      <div className="text-center p-8">
                        <MapPin className="h-16 w-16 text-teal-600 dark:text-teal-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {t.addressLabel}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{displayAddress}</p>
                        <a
                          href="https://maps.google.com/?q=30.0444,31.2357"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-l from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <MapPin className="h-5 w-5" />
                          {t.openInMaps}
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
