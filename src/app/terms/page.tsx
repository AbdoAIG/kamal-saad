'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Shield } from 'lucide-react';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';

export default function TermsPage() {
  const { language } = useStore();
  const isArabic = language === 'ar';
  const [content, setContent] = useState<{ terms: string; privacy: string }>({ terms: '', privacy: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setContent({
            terms: data.settings.terms_content || '',
            privacy: data.settings.privacy_content || '',
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const termsTitle = isArabic ? 'سياسة الشروط والأحكام' : 'Terms & Conditions';
  const privacyTitle = isArabic ? 'سياسة الخصوصية' : 'Privacy Policy';

  const defaultTerms = isArabic
    ? `# شروط وأحكام استخدام موقع كمال سعد

## المقدمة
مرحباً بكم في موقع كمال سعد للمستلزمات المكتبية والمدرسية. باستخدامك لهذا الموقع، فإنك توافق على الشروط والأحكام التالية. يرجى قراءتها بعناية قبل المتابعة.

## 1. التعريفات
- **الموقع**: موقع كمال سعد الإلكتروني على الإنترنت
- **المستخدم**: كل من يزور أو يستخدم الموقع
- **المنتجات**: المستلزمات المكتبية والمدرسية المعروضة للبيع
- **العميل**: المستخدم الذي يقوم بعملية شراء

## 2. التسجيل والحسابات
- يجب أن يكون عمرك 18 عاماً أو أكثر لإنشاء حساب
- يجب تقديم معلومات صحيحة ودقيقة عند التسجيل
- أنت مسؤول عن الحفاظ على سرية بيانات حسابك
- يُحظر استخدام حساب شخص آخر بدون إذنه

## 3. المنتجات والأسعار
- الأسعار المعروضة بالجنيه المصري تشمل ضريبة القيمة المضافة
- نحتفظ بحق تعديل الأسعار في أي وقت دون إشعار مسبق
- الصور المعروضة للأغراض التوضيحية وقد يختلف المنتج الفعلي قليلاً
- نحرص على عرض المعلومات الصحيحة عن المنتجات

## 4. الطلبات والدفع
- إتمام عملية الشراء يعني قبولك لهذه الشروط
- نحن نحتفظ بحق قبول أو رفض أي طلب
- الدفع يتم عبر طرق الدفع المتاحة على الموقع
- يجب الدفع خلال المهلة المحددة بعد تأكيد الطلب

## 5. الشحن والتوصيل
- يتم التوصيل خلال 2-5 أيام عمل حسب منطقتك
- رسوم الشحن تختلف حسب منطقة التوصيل
- لا نتحمل مسؤولية التأخير الناتج عن ظروف خارجة عن إرادتنا

## 6. الإرجاع والاستبدال
- يمكنك إرجاع المنتج خلال 14 يوماً من تاريخ الاستلام
- يجب أن يكون المنتج في حالته الأصلية غير مستخدم
- لا يقبل إرجاع المنتجات المخفضة أو المستعملة
- يتم استرداد المبلغ خلال 7-14 يوم عمل

## 7. الملكية الفكرية
- جميع محتويات الموقع محمية بحقوق النشر
- يُحظر نسخ أو إعادة استخدام أي محتوى بدون إذن كتابي

## 8. الحد الأقصى للمسؤولية
- لا نتحمل مسؤولية أي أضرار غير مباشرة ناتجة عن استخدام الموقع
- مسؤوليتنا لا تتجاوز قيمة المنتج المشتري

## 9. التعديلات على الشروط
- نحتفظ بحق تعديل هذه الشروط في أي وقت
- سيتم إشعاركم بأي تغييرات عبر الموقع

## 10. التواصل
لأي استفسارات، يرجى التواصل معنا عبر صفحة اتصل بنا.

---
**آخر تحديث**: يناير 2025`
    : `# Terms & Conditions for Kamal Saad

## Introduction
Welcome to Kamal Saad's website for office and school supplies. By using this website, you agree to the following terms and conditions. Please read them carefully before proceeding.

## 1. Definitions
- **Website**: Kamal Saad's e-commerce website
- **User**: Anyone who visits or uses the website
- **Products**: Office and school supplies displayed for sale
- **Customer**: A user who makes a purchase

## 2. Registration & Accounts
- You must be at least 18 years old to create an account
- You must provide accurate and truthful information during registration
- You are responsible for maintaining the confidentiality of your account
- Using another person's account without permission is prohibited

## 3. Products & Prices
- Prices displayed are in Egyptian Pounds and include VAT
- We reserve the right to modify prices at any time without prior notice
- Product images are for illustration purposes and may differ slightly
- We strive to display accurate product information

## 4. Orders & Payment
- Completing a purchase means you accept these terms
- We reserve the right to accept or reject any order
- Payment is made through available payment methods on the website
- Payment must be completed within the specified timeframe

## 5. Shipping & Delivery
- Delivery takes 2-5 business days depending on your location
- Shipping fees vary based on delivery area
- We are not responsible for delays caused by circumstances beyond our control

## 6. Returns & Exchanges
- You can return products within 14 days from the delivery date
- Products must be in their original, unused condition
- Discounted or used products cannot be returned
- Refunds are processed within 7-14 business days

## 7. Intellectual Property
- All website content is protected by copyright
- Copying or reusing any content without written permission is prohibited

## 8. Limitation of Liability
- We are not liable for any indirect damages resulting from website use
- Our liability does not exceed the value of the purchased product

## 9. Modifications to Terms
- We reserve the right to modify these terms at any time
- You will be notified of any changes through the website

## 10. Contact
For any inquiries, please contact us via the Contact Us page.

---
**Last Updated**: January 2025`;

  const defaultPrivacy = isArabic
    ? `# سياسة الخصوصية

## المقدمة
في كمال سعد، نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك.

## 1. المعلومات التي نجمعها
- **الاسم والبريد الإلكتروني**: عند التسجيل أو إرسال رسالة
- **رقم الهاتف**: للتواصل وتأكيد الطلبات
- **عنوان الشحن**: لتوصيل طلباتك
- **معلومات الدفع**: يتم التعامل معها بشكل آمن عبر بوابات الدفع
- **بيانات التصفح**: يتم جمعها لتحسين تجربة المستخدم

## 2. كيف نستخدم معلوماتك
- معالجة وتوصيل طلباتك
- التواصل معك بخصوص الطلبات
- تحسين خدماتنا ومنتجاتنا
- إرسال عروض وتخفيضات (بموافقتك)
- تحليل بيانات التصفح لتحسين الموقع

## 3. حماية المعلومات
- نستخدم تشفير SSL لتأمين نقل البيانات
- لا يتم مشاركة بياناتك مع أطراف ثالثة إلا الضروريين لتنفيذ الطلبات
- يتم تخزين البيانات على خوادم آمنة
- نتبع أفضل ممارسات الأمان في حماية البيانات

## 4. ملفات تعريف الارتباط (Cookies)
- نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح
- يمكنك التحكم في إعدادات ملفات تعريف الارتباط من المتصفح
- نستخدمها لتحليل حركة المرور وتخصيص المحتوى

## 5. حقوقك
- حق الوصول إلى بياناتك الشخصية
- حق تصحيح البيانات غير الدقيقة
- حق طلب حذف حسابك وبياناتك
- حق الاعتراض على معالجة بياناتك

## 6. مشاركة البيانات
- **شركات الشحن**: لتوصيل طلباتك فقط
- **بوابات الدفع**: لمعالجة المدفوعات بأمان
- **الجهات الحكومية**: عند الطلب القانوني فقط
- لن نبيع أو نتاجر ببياناتك الشخصية

## 7. الاحتفاظ بالبيانات
- نحتفظ ببياناتك طالما كان حسابك نشطاً
- بعد حذف الحساب، يتم حذف البيانات خلال 30 يوماً
- يتم الاحتفاظ ببيانات الطلبات لأغراض قانونية

## 8. التحديثات
- قد نحدث هذه السياسة من وقت لآخر
- سنشعرك بأي تغييرات مهمة عبر الموقع أو البريد الإلكتروني

## 9. التواصل
لأي استفسارات بخصوص الخصوصية، تواصل معنا عبر صفحة اتصل بنا.

---
**آخر تحديث**: يناير 2025`
    : `# Privacy Policy

## Introduction
At Kamal Saad, we respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and protect your information.

## 1. Information We Collect
- **Name & Email**: During registration or when sending a message
- **Phone Number**: For contact and order confirmation
- **Shipping Address**: To deliver your orders
- **Payment Information**: Handled securely through payment gateways
- **Browsing Data**: Collected to improve user experience

## 2. How We Use Your Information
- Processing and delivering your orders
- Contacting you regarding orders
- Improving our services and products
- Sending offers and discounts (with your consent)
- Analyzing browsing data to improve the website

## 3. Information Protection
- We use SSL encryption to secure data transmission
- Your data is not shared with third parties except those necessary for order fulfillment
- Data is stored on secure servers
- We follow best security practices

## 4. Cookies
- We use cookies to improve browsing experience
- You can control cookie settings from your browser
- We use them for traffic analysis and content personalization

## 5. Your Rights
- Right to access your personal data
- Right to correct inaccurate data
- Right to request deletion of your account and data
- Right to object to data processing

## 6. Data Sharing
- **Shipping Companies**: For delivery purposes only
- **Payment Gateways**: For secure payment processing
- **Government Authorities**: Upon legal request only
- We will never sell or trade your personal data

## 7. Data Retention
- We retain your data as long as your account is active
- After account deletion, data is removed within 30 days
- Order data is retained for legal purposes

## 8. Updates
- We may update this policy from time to time
- We will notify you of significant changes via the website or email

## 9. Contact
For any privacy-related inquiries, contact us via the Contact Us page.

---
**Last Updated**: January 2025`;

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const key = `line-${i}`;

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={key} className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={key} className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mt-6 mb-3">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={key} className="text-lg font-bold text-gray-700 dark:text-gray-200 mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={key} className="text-gray-600 dark:text-gray-300 mr-4 list-disc">
            <span dangerouslySetInnerHTML={{ __html: line.replace('- ', '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </li>
        );
      } else if (line === '---') {
        elements.push(<hr key={key} className="my-6 border-gray-200 dark:border-gray-700" />);
      } else if (line.trim() === '') {
        elements.push(<div key={key} className="h-3" />);
      } else {
        elements.push(
          <p key={key} className="text-gray-600 dark:text-gray-300 leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          </p>
        );
      }
    }
    return elements;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin h-8 w-8 border-4 border-teal-200 border-t-teal-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950" dir={isArabic ? 'rtl' : 'ltr'}>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-l from-teal-600 to-cyan-600 py-12">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center text-white">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-80" />
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                {isArabic ? 'سياسة الشروط والخصوصية' : 'Terms & Privacy Policy'}
              </h1>
              <p className="text-teal-100 max-w-xl mx-auto">
                {isArabic ? 'يرجى قراءة الشروط والأحكام وسياسة الخصوصية بعناية' : 'Please read the terms, conditions, and privacy policy carefully'}
              </p>
              <Link href="/">
                <Button variant="outline" className="mt-5 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                  {isArabic ? <ArrowLeft className="h-4 w-4 ml-2 rotate-180" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
                  {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Terms */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div id="terms" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-10 scroll-mt-24">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-gray-700">
                <div className="h-10 w-10 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{termsTitle}</h2>
              </div>
              <div className="space-y-1">{renderMarkdown(content.terms || defaultTerms)}</div>
            </motion.div>

            {/* Privacy */}
            <motion.div id="privacy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-10 mt-8 scroll-mt-24">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b dark:border-gray-700">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{privacyTitle}</h2>
              </div>
              <div className="space-y-1">{renderMarkdown(content.privacy || defaultPrivacy)}</div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
