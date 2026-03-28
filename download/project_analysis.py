from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import arabic_reshaper
from bidi.algorithm import get_display

# Register fonts that support Arabic
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans-Bold')

def arabic(text):
    """Convert Arabic text to proper display format"""
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)

# Create document
doc = SimpleDocTemplate(
    "/home/z/my-project/download/project_analysis.pdf",
    pagesize=A4,
    rightMargin=2*cm,
    leftMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title='Kamal_Saad_Project_Analysis',
    author='Z.ai',
    creator='Z.ai',
    subject='Detailed Analysis of Kamal Saad E-commerce Project'
)

styles = getSampleStyleSheet()

# Custom styles for Arabic (RTL)
cover_title = ParagraphStyle(
    'CoverTitle',
    fontName='DejaVuSans-Bold',
    fontSize=32,
    alignment=TA_CENTER,
    spaceAfter=30,
    textColor=colors.HexColor('#1F4E79')
)

cover_subtitle = ParagraphStyle(
    'CoverSubtitle',
    fontName='DejaVuSans',
    fontSize=18,
    alignment=TA_CENTER,
    spaceAfter=20,
    textColor=colors.HexColor('#666666')
)

h1_style = ParagraphStyle(
    'H1Arabic',
    fontName='DejaVuSans-Bold',
    fontSize=18,
    alignment=TA_LEFT,
    spaceBefore=20,
    spaceAfter=15,
    textColor=colors.HexColor('#1F4E79')
)

h2_style = ParagraphStyle(
    'H2Arabic',
    fontName='DejaVuSans-Bold',
    fontSize=14,
    alignment=TA_LEFT,
    spaceBefore=15,
    spaceAfter=10,
    textColor=colors.HexColor('#2E75B6')
)

h3_style = ParagraphStyle(
    'H3Arabic',
    fontName='DejaVuSans-Bold',
    fontSize=12,
    alignment=TA_LEFT,
    spaceBefore=10,
    spaceAfter=8,
    textColor=colors.HexColor('#404040')
)

body_style = ParagraphStyle(
    'BodyArabic',
    fontName='DejaVuSans',
    fontSize=10,
    alignment=TA_LEFT,
    spaceBefore=5,
    spaceAfter=8,
    leading=16
)

body_style_center = ParagraphStyle(
    'BodyCenter',
    fontName='DejaVuSans',
    fontSize=11,
    alignment=TA_CENTER,
    spaceBefore=5,
    spaceAfter=8,
    leading=16
)

cell_style = ParagraphStyle(
    'TableCell',
    fontName='DejaVuSans',
    fontSize=9,
    alignment=TA_CENTER,
    leading=12
)

header_style = ParagraphStyle(
    'TableHeader',
    fontName='DejaVuSans-Bold',
    fontSize=10,
    alignment=TA_CENTER,
    textColor=colors.white,
    leading=12
)

story = []

# Cover Page
story.append(Spacer(1, 3*cm))
story.append(Paragraph(arabic("تقرير التحليل التفصيلي"), cover_title))
story.append(Paragraph(arabic("مشروع متجر كمال سعد"), cover_subtitle))
story.append(Spacer(1, 1*cm))
story.append(Paragraph(arabic("للأدوات المكتبية والمدرسية"), cover_subtitle))
story.append(Spacer(1, 3*cm))

# Summary box
summary_data = [
    [Paragraph(arabic("القيمة"), header_style), Paragraph(arabic("البند"), header_style)],
    [Paragraph(arabic("154 ملف"), cell_style), Paragraph(arabic("عدد ملفات المصدر"), cell_style)],
    [Paragraph(arabic("48 نقطة نهاية"), cell_style), Paragraph(arabic("نقاط نهاية API"), cell_style)],
    [Paragraph(arabic("73 مكون"), cell_style), Paragraph(arabic("مكونات الواجهة"), cell_style)],
    [Paragraph(arabic("18 نموذج"), cell_style), Paragraph(arabic("نماذج قاعدة البيانات"), cell_style)],
    [Paragraph("Next.js 16, Prisma, PostgreSQL", cell_style), Paragraph(arabic("التقنيات المستخدمة"), cell_style)],
]

summary_table = Table(summary_data, colWidths=[7*cm, 7*cm])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
story.append(summary_table)

story.append(Spacer(1, 2*cm))
story.append(Paragraph(arabic("مارس 2026"), body_style_center))
story.append(PageBreak())

# Section 1: Executive Summary
story.append(Paragraph(arabic("1. الملخص التنفيذي"), h1_style))
story.append(Paragraph(arabic("مشروع متجر كمال سعد هو منصة تجارة إلكترونية متكاملة مبنية باستخدام أحدث تقنيات تطوير الويب. يهدف المشروع لتوفير تجربة تسوق سلسة للعملاء مع لوحة تحكم إدارية شاملة. يتضمن المشروع نظام إدارة منتجات، طلبات، عملاء، تقييمات، نظام ولاء، وإشعارات. يعتمد المشروع على Next.js 16 كإطار عمل رئيسي مع Prisma كـ ORM وقاعدة بيانات PostgreSQL."), body_style))

# Section 2: Current Features
story.append(Paragraph(arabic("2. الميزات الحالية"), h1_style))

story.append(Paragraph(arabic("2.1 واجهة المتجر"), h2_style))
store_features = [
    [arabic("صفحة رئيسية"), arabic("عرض المنتجات المميزة، البنرات، البحث، الفلترة")],
    [arabic("صفحة المنتج"), arabic("تفاصيل كاملة، صور متعددة، تكبير، مشاركة")],
    [arabic("سلة التسوق"), arabic("إضافة، تعديل، حذف، حساب الأسعار")],
    [arabic("المفضلة"), arabic("حفظ المنتجات المفضلة")],
    [arabic("البحث"), arabic("بحث متقدم بفلترة حسب الفئة والسعر")],
    [arabic("التقييمات"), arabic("كتابة وعرض التقييمات مع صور")],
    [arabic("الملف الشخصي"), arabic("إدارة البيانات والعناوين")],
    [arabic("الطلبات"), arabic("عرض وتتبع الطلبات")],
]
for feature in store_features:
    story.append(Paragraph(f"{arabic(feature[0])}: {arabic(feature[1])}", body_style))

story.append(Paragraph(arabic("2.2 لوحة تحكم الأدمن"), h2_style))
admin_features = [
    [arabic("نظرة عامة"), arabic("إحصائيات المبيعات والطلبات والمنتجات")],
    [arabic("إدارة الطلبات"), arabic("عرض، فلترة، تغيير الحالة، تفاصيل")],
    [arabic("إدارة المنتجات"), arabic("إضافة، تعديل، حذف، بحث، رفع صور")],
    [arabic("إدارة الفئات"), arabic("إنشاء وتعديل الفئات")],
    [arabic("إدارة العملاء"), arabic("عرض بيانات العملاء")],
    [arabic("البنرات الإعلانية"), arabic("إدارة البنرات الرئيسية")],
    [arabic("التقارير"), arabic("تقارير المبيعات والتصدير")],
    [arabic("الإعدادات"), arabic("إعدادات الموقع العامة")],
]
for feature in admin_features:
    story.append(Paragraph(f"{arabic(feature[0])}: {arabic(feature[1])}", body_style))

story.append(Paragraph(arabic("2.3 نظام المصادقة"), h2_style))
story.append(Paragraph(arabic("يتضمن المشروع نظام مصادقة متكامل يدعم تسجيل الدخول بالبريد وكلمة المرور، تسجيل الدخول بحساب جوجل، إدارة الجلسات، نظام أدوار (عميل، مدير، مدير عام)، وحماية المسارات الإدارية."), body_style))

# Section 3: Technical Analysis
story.append(Paragraph(arabic("3. التحليل التقني"), h1_style))

story.append(Paragraph(arabic("3.1 البنية التقنية"), h2_style))
tech_data = [
    [Paragraph(arabic("الاستخدام"), header_style), Paragraph(arabic("التقنية"), header_style), Paragraph(arabic("الطبقة"), header_style)],
    [Paragraph(arabic("واجهة المستخدم و SSR"), cell_style), Paragraph("Next.js 16 + React", cell_style), Paragraph("Frontend", cell_style)],
    [Paragraph(arabic("التصميم والمكونات"), cell_style), Paragraph("Tailwind CSS + shadcn/ui", cell_style), Paragraph("Styling", cell_style)],
    [Paragraph(arabic("واجهات برمجة التطبيقات"), cell_style), Paragraph("Next.js API Routes", cell_style), Paragraph("Backend", cell_style)],
    [Paragraph(arabic("تخزين البيانات"), cell_style), Paragraph("PostgreSQL + Prisma", cell_style), Paragraph("Database", cell_style)],
    [Paragraph(arabic("المصادقة والجلسات"), cell_style), Paragraph("NextAuth.js", cell_style), Paragraph("Auth", cell_style)],
    [Paragraph(arabic("تخزين وتحويل الصور"), cell_style), Paragraph("Cloudinary", cell_style), Paragraph("Images", cell_style)],
    [Paragraph(arabic("الحركات والتأثيرات"), cell_style), Paragraph("Framer Motion", cell_style), Paragraph("Animations", cell_style)],
]

tech_table = Table(tech_data, colWidths=[5*cm, 5*cm, 4*cm])
tech_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
story.append(tech_table)
story.append(Spacer(1, 15))

story.append(Paragraph(arabic("3.2 نماذج قاعدة البيانات"), h2_style))
story.append(Paragraph(arabic("يتضمن المشروع 18 نموذج قاعدة بيانات تشمل: User, Product, Category, Order, OrderItem, Cart, CartItem, Review, Coupon, Notification, Address, LoyaltyHistory, Return, ReturnItem, StockNotification, Banner, SiteSetting, Role, Permission. العلاقات محددة بشكل صحيح مع عمليات الحذف المتسلسل والفهارس المناسبة."), body_style))

# Section 4: Gap Analysis
story.append(PageBreak())
story.append(Paragraph(arabic("4. تحليل الفجوات"), h1_style))

story.append(Paragraph(arabic("4.1 الفجوات الحرجة (يجب معالجتها)"), h2_style))

critical_gaps = [
    [arabic("الاختبارات"), arabic("لا توجد اختبارات وحدة أو تكامل"), arabic("إضافة Jest و Testing Library"), arabic("عالي جداً")],
    [arabic("التحقق من البيانات"), arabic("لا يوجد Zod أو validation"), arabic("إضافة Zod للـ APIs"), arabic("عالي جداً")],
    [arabic("التخزين المؤقت"), arabic("لا يوجد Caching"), arabic("Redis أو Next.js Cache"), arabic("عالي")],
    [arabic("معالجة الأخطاء"), arabic("غير موحدة"), arabic("نظام أخطاء مركزي"), arabic("عالي")],
    [arabic("التوثيق"), arabic("لا يوجد توثيق API"), arabic("Swagger/OpenAPI"), arabic("عالي")],
]

critical_table_data = [[Paragraph(arabic("الأولوية"), header_style), Paragraph(arabic("الحل المقترح"), header_style), Paragraph(arabic("المشكلة"), header_style), Paragraph(arabic("البند"), header_style)]]
for gap in critical_gaps:
    critical_table_data.append([
        Paragraph(gap[3], cell_style),
        Paragraph(gap[2], cell_style),
        Paragraph(gap[1], cell_style),
        Paragraph(gap[0], cell_style)
    ])

critical_table = Table(critical_table_data, colWidths=[2*cm, 5*cm, 5*cm, 3*cm])
critical_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#C00000')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFF2F2')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(critical_table)
story.append(Spacer(1, 15))

story.append(Paragraph(arabic("4.2 فجوات الأمان"), h2_style))
security_gaps = [
    ["CSRF Protection", arabic("محمول جزئياً"), arabic("إضافة CSRF tokens")],
    ["Rate Limiting", arabic("موجود لكن في الذاكرة"), arabic("استخدام Redis")],
    ["Input Sanitization", arabic("غير موجود"), arabic("إضافة DOMPurify")],
    ["HTTPS Headers", arabic("غير مكتمل"), arabic("إضافة security headers")],
    ["SQL Injection", arabic("Prisma يحمي"), arabic("مراجعة الاستعلامات")],
    ["XSS Protection", arabic("محمول جزئياً"), arabic("إضافة CSP headers")],
]
for gap in security_gaps:
    story.append(Paragraph(f"{gap[0]}: {arabic(gap[1])} - {arabic(gap[2])}", body_style))

story.append(Paragraph(arabic("4.3 فجوات الأداء"), h2_style))
performance_gaps = [
    ["Image Optimization", arabic("يستخدم Cloudinary لكن بدون lazy loading كامل"), arabic("تحسين التحميل الكسول")],
    ["Database Queries", arabic("بعض الاستعلامات غير محسنة"), arabic("إضافة فهارس وتحسين")],
    ["Bundle Size", arabic("لم يتم تحسينه"), arabic("Code splitting و tree shaking")],
    ["CDN", arabic("لا يوجد CDN للمحتوى الثابت"), arabic("إضافة CDN")],
    ["Server Components", arabic("يستخدمها جزئياً"), arabic("تحويل المزيد من المكونات")],
]
for gap in performance_gaps:
    story.append(Paragraph(f"{gap[0]}: {arabic(gap[1])} - {arabic(gap[2])}", body_style))

story.append(Paragraph(arabic("4.4 فجوات الميزات"), h2_style))
feature_gaps = [
    [arabic("صفحات قانونية"), arabic("سياسة الخصوصية، الشروط"), arabic("مفقودة تماماً")],
    [arabic("صفحة من نحن"), arabic("عن المتجر"), arabic("مفقودة")],
    ["FAQ", arabic("الأسئلة الشائعة"), arabic("مفقودة")],
    ["Live Chat", arabic("دعم العملاء المباشر"), arabic("مفقود")],
    ["Push Notifications", arabic("إشعارات المتصفح"), arabic("مفقودة")],
    ["SMS Integration", arabic("إشعارات SMS"), arabic("مفقودة")],
    ["Analytics", arabic("تحليلات المستخدمين"), arabic("مفقودة")],
    ["A/B Testing", arabic("اختبار الميزات"), arabic("مفقود")],
    ["Multi-language", arabic("العربية والإنجليزية"), arabic("موجود جزئياً")],
    ["Multi-currency", arabic("عملات متعددة"), arabic("مفقود")],
    ["Inventory Alerts", arabic("تنبيهات المخزون"), arabic("موجود جزئياً")],
    ["Backup System", arabic("النسخ الاحتياطي"), arabic("مفقود")],
]
for gap in feature_gaps:
    story.append(Paragraph(f"{arabic(gap[0]) if not gap[0].isascii() else gap[0]}: {arabic(gap[1])} - {arabic(gap[2])}", body_style))

# Section 5: Recommendations
story.append(PageBreak())
story.append(Paragraph(arabic("5. التوصيات للجاهزية التجارية"), h1_style))

story.append(Paragraph(arabic("5.1 أولويات فورية (الأسبوع 1-2)"), h2_style))
story.append(Paragraph(arabic("يجب البدء فوراً بإضافة نظام اختبارات شامل باستخدام Jest و React Testing Library لضمان جودة الكود. كذلك إضافة Zod للتحقق من صحة البيانات في جميع API endpoints. يجب أيضاً إنشاء نظام مركزي لمعالجة الأخطاء مع تسجيل الأخطاء وإشعارات المطورين. التوثيق ضروري جداً باستخدام Swagger أو OpenAPI لتوثيق جميع نقاط النهاية."), body_style))

story.append(Paragraph(arabic("5.2 أولويات قصيرة المدى (الشهر 1)"), h2_style))
story.append(Paragraph(arabic("يحتاج المشروع إلى إضافة Redis للتخزين المؤقت وإدارة الجلسات بشكل أفضل. الصفحات القانونية ضرورية جداً مثل سياسة الخصوصية وشروط الاستخدام. التحسينات الأمنية مهمة مثل إضافة CSRF protection و Content Security Policy headers. يجب أيضاً تحسين SEO بشكل أكبر مع إضافة Schema markup للمنتجات."), body_style))

story.append(Paragraph(arabic("5.3 أولويات متوسطة المدى (الشهر 2-3)"), h2_style))
story.append(Paragraph(arabic("يتطلب المشروع نظام دعم عملاء متكامل يشمل Live Chat و ticket system. التكامل مع بوابات دفع مصرية مثل Fawry و Paymob ضروري للسوق المصري. نظام التحليلات مهم جداً لفهم سلوك المستخدمين مع تكامل Google Analytics 4. نظام النسخ الاحتياطي التلقائي ضروري لحماية البيانات."), body_style))

story.append(Paragraph(arabic("5.4 أولويات طويلة المدى (الشهر 4-6)"), h2_style))
story.append(Paragraph(arabic("للوصول لمستوى احترافي، يحتاج المشروع إلى تطبيق موبايل باستخدام React Native أو Flutter. نظام A/B Testing لاختبار الميزات الجديدة. تكامل مع أنظمة ERP للمحاسبة وإدارة المخزون. نظام التوصيات باستخدام AI لاقتراح المنتجات. Dashboard تحليلات متقدم للمديرين."), body_style))

# Section 6: Scaling Considerations
story.append(Paragraph(arabic("6. اعتبارات التوسع"), h1_style))

story.append(Paragraph(arabic("6.1 للتوسع إلى آلاف الزوار يومياً"), h2_style))
scaling_items = [
    arabic("استخدام Vercel Enterprise أو خادم مخصص"),
    arabic("إضافة CDN عالمي للصور والملفات الثابتة"),
    arabic("تحسين استعلامات قاعدة البيانات وإضافة Read Replicas"),
    arabic("استخدام Redis للجلسات والتخزين المؤقت"),
    arabic("تقسيم الخدمات (Microservices) للطلبات والدفع"),
    arabic("إضافة Load Balancer لتوزيع الحمل"),
]
for item in scaling_items:
    story.append(Paragraph(f"• {item}", body_style))

story.append(Paragraph(arabic("6.2 للجاهزية للبيع للشركات"), h2_style))
sale_items = [
    arabic("كود نظيف وموثق بالكامل"),
    arabic("اختبارات مع 80% تغطية على الأقل"),
    arabic("توثيق API كامل"),
    arabic("دليل نشر وصيانة"),
    arabic("نظام تسجيل مراقبة (Monitoring و Logging)"),
    arabic("نسخ احتياطي تلقائي"),
    arabic("خطة استجابة للحوادث"),
    arabic("عقد SLA محدد"),
    arabic("ترخيص واضح للكود"),
]
for item in sale_items:
    story.append(Paragraph(f"• {item}", body_style))

# Section 7: Cost Estimate
story.append(PageBreak())
story.append(Paragraph(arabic("7. تقدير التكلفة والجهد"), h1_style))

cost_data = [
    [Paragraph(arabic("الأولوية"), header_style), Paragraph(arabic("الجهد"), header_style), Paragraph(arabic("المهام"), header_style), Paragraph(arabic("المرحلة"), header_style)],
    [Paragraph(arabic("حرج"), cell_style), Paragraph(arabic("40-60 ساعة"), cell_style), Paragraph(arabic("Unit + Integration Tests"), cell_style), Paragraph(arabic("الاختبارات"), cell_style)],
    [Paragraph(arabic("حرج"), cell_style), Paragraph(arabic("15-20 ساعة"), cell_style), Paragraph(arabic("Zod + Validation"), cell_style), Paragraph(arabic("التحقق من البيانات"), cell_style)],
    [Paragraph(arabic("حرج"), cell_style), Paragraph(arabic("20-30 ساعة"), cell_style), Paragraph(arabic("CSRF + CSP + Headers"), cell_style), Paragraph(arabic("الأمان"), cell_style)],
    [Paragraph(arabic("عالي"), cell_style), Paragraph(arabic("25-35 ساعة"), cell_style), Paragraph(arabic("API + User Docs"), cell_style), Paragraph(arabic("التوثيق"), cell_style)],
    [Paragraph(arabic("عالي"), cell_style), Paragraph(arabic("10-15 ساعة"), cell_style), Paragraph(arabic("Privacy + Terms + About"), cell_style), Paragraph(arabic("الصفحات القانونية"), cell_style)],
    [Paragraph(arabic("عالي"), cell_style), Paragraph(arabic("15-20 ساعة"), cell_style), Paragraph(arabic("Implementation"), cell_style), Paragraph(arabic("Redis Cache"), cell_style)],
    [Paragraph(arabic("متوسط"), cell_style), Paragraph(arabic("30-40 ساعة"), cell_style), Paragraph(arabic("Fawry + Paymob"), cell_style), Paragraph(arabic("بوابات الدفع"), cell_style)],
    [Paragraph(arabic("متوسط"), cell_style), Paragraph(arabic("20-25 ساعة"), cell_style), Paragraph(arabic("Integration"), cell_style), Paragraph(arabic("Live Chat"), cell_style)],
    [Paragraph(arabic("منخفض"), cell_style), Paragraph(arabic("200-300 ساعة"), cell_style), Paragraph(arabic("React Native/Flutter"), cell_style), Paragraph(arabic("تطبيق موبايل"), cell_style)],
]

cost_table = Table(cost_data, colWidths=[2.5*cm, 3.5*cm, 5*cm, 4*cm])
cost_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.white),
    ('BACKGROUND', (0, 8), (-1, 8), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 9), (-1, 9), colors.white),
    ('BACKGROUND', (0, 10), (-1, 10), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(cost_table)
story.append(Spacer(1, 20))

story.append(Paragraph(arabic("إجمالي التقدير للجاهزية الأساسية للبيع: حوالي 150-200 ساعة عمل إضافية للوصول لمستوى يمكن بيعه للشركات مع ضمانات الجودة الأساسية."), body_style))

# Section 8: Conclusion
story.append(Paragraph(arabic("8. الخلاصة"), h1_style))
story.append(Paragraph(arabic("مشروع كمال سعد يمثل قاعدة قوية لمتجر إلكتروني متكامل. الكود نظيف نسبياً والبنية التقنية حديثة. لكن لتحويله لمنتج تجاري قابل للبيع واستضافة آلاف المستخدمين، يحتاج لاستثمار إضافي في عدة مجالات حرجة أبرزها الاختبارات والأمان والتوثيق. المشروع حالياً مناسب للتشغيل بمقياس صغير إلى متوسط، لكن يحتاج تحسينات جوهرية للجاهزية التجارية الكاملة."), body_style))

# Build PDF
doc.build(story)
print("PDF generated successfully with proper Arabic text!")
