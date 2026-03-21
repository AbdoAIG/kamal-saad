import { Store, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-6 w-6 text-emerald-400" />
              <span className="text-xl font-bold text-emerald-400">مكتبتي</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              متجرك الأول للمنتجات المكتبية والمدرسية. نوفر لك كل ما تحتاجه من أقلام ودفاتر وأدوات مدرسية بأسعار منافسة وجودة عالية.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">الرئيسية</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">المنتجات</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">العروض</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">من نحن</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">اتصل بنا</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-lg mb-4">الفئات</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">أقلام</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">دفاتر وكراسات</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">أدوات مدرسية</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">أدوات فنية</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">حقائب</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">تواصل معنا</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400" />
                <span dir="ltr">+966 50 000 0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-400" />
                <span>info@maktabati.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>الرياض، المملكة العربية السعودية</span>
              </li>
            </ul>
            
            {/* Social */}
            <div className="flex gap-3 mt-4">
              <a href="#" className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-emerald-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>© 2024 مكتبتي. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
