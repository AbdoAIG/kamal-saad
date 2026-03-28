from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.lib.units import cm
import arabic_reshaper
from bidi.algorithm import get_display

# Register Arabic font
pdfmetrics.registerFont(TTFont('Amiri', '/home/z/my-project/fonts/Amiri-1.000/Amiri-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Amiri-Bold', '/home/z/my-project/fonts/Amiri-1.000/Amiri-Bold.ttf'))

registerFontFamily('Amiri', normal='Amiri', bold='Amiri-Bold')

def arabic_text(text):
    """Convert Arabic text to proper display format"""
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)

# Create document
doc = SimpleDocTemplate(
    "/home/z/my-project/download/maktabati_feature_suggestions.pdf",
    pagesize=A4,
    rightMargin=2*cm,
    leftMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm
)

# Define styles
title_style = ParagraphStyle(
    name='Title',
    fontName='Amiri-Bold',
    fontSize=24,
    leading=36,
    alignment=TA_CENTER,
    spaceAfter=30
)

subtitle_style = ParagraphStyle(
    name='Subtitle',
    fontName='Amiri',
    fontSize=14,
    leading=20,
    alignment=TA_CENTER,
    spaceAfter=20,
    textColor=colors.HexColor('#666666')
)

section_style = ParagraphStyle(
    name='Section',
    fontName='Amiri-Bold',
    fontSize=16,
    leading=24,
    alignment=TA_RIGHT,
    spaceBefore=20,
    spaceAfter=12,
    textColor=colors.HexColor('#1F4E79')
)

body_style = ParagraphStyle(
    name='Body',
    fontName='Amiri',
    fontSize=11,
    leading=20,
    alignment=TA_RIGHT,
    spaceAfter=8,
    wordWrap='CJK'
)

feature_title_style = ParagraphStyle(
    name='FeatureTitle',
    fontName='Amiri-Bold',
    fontSize=12,
    leading=18,
    alignment=TA_RIGHT,
    spaceAfter=4,
    textColor=colors.HexColor('#2E7D32')
)

# Build story
story = []

# Cover page
story.append(Spacer(1, 80))
story.append(Paragraph(arabic_text("تقرير المقترحات"), title_style))
story.append(Paragraph(arabic_text("مميزات إضافية لموقع كمال سعد للقرطاسية"), subtitle_style))
story.append(Spacer(1, 30))
story.append(Paragraph(arabic_text("تحليل شامل للمميزات الناقصة والتحسينات المقترحة"), subtitle_style))
story.append(Spacer(1, 50))

# Summary stats table
summary_data = [
    [arabic_text('المجموع'), arabic_text('متوسطة'), arabic_text('عالية')],
    ['35', '15', '20'],
]
summary_table = Table(summary_data, colWidths=[100, 100, 100])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, -1), 'Amiri'),
    ('FONTSIZE', (0, 0), (-1, 0), 11),
    ('FONTSIZE', (0, 1), (-1, 1), 14),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
    ('TOPPADDING', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
]))
story.append(summary_table)

story.append(PageBreak())

# Section 1: High Priority Features
story.append(Paragraph(arabic_text("المميزات عالية الأولوية"), section_style))
story.append(Spacer(1, 10))

high_priority_features = [
    ("نظام التقييمات والمراجعات", "تمكين العملاء من كتابة تقييمات ومراجعات للمنتجات مع إمكانية إضافة صور. هذا يعزز الثقة ويساعد العملاء الآخرين في اتخاذ قرارات الشراء. يجب أن يتضمن النظام تصنيف بالنجوم من ١ إلى ٥، ونص المراجعة، وإمكانية الرد من قبل المتجر."),
    ("صفحة سجل الطلبات", "إنشاء صفحة خاصة لكل عميل تعرض جميع طلباته السابقة مع تفاصيل كل طلب مثل حالة الطلب، تاريخ الشراء، المنتجات، والمبلغ الإجمالي. يمكن للعميل أيضاً إعادة طلب نفس المنتجات مرة أخرى."),
    ("صفحة الملف الشخصي", "إضافة صفحة للملف الشخصي تمكن العميل من تعديل بياناته مثل الاسم، البريد الإلكتروني، رقم الهاتف، والعناوين المحفوظة. يمكن أيضاً إضافة عناوين متعددة للشحن."),
    ("نظام الإشعارات", "تطوير نظام إشعارات متكامل يرسل تنبيهات للعملاء عبر البريد الإلكتروني أو الرسائل النصية عند تغيير حالة الطلب، أو عند توفر منتج نفد من المخزون، أو عند وجود عروض جديدة."),
    ("تتبع الشحن", "ربط الموقع مع شركات الشحن المحلية مثل أرامكس وفيدكس لتوفير خاصية تتبع الشحن في الوقت الفعلي. يمكن للعميل معرفة موقع شحنته ووقت الوصول المتوقع."),
    ("نظام القسائم والخصومات", "إضافة نظام كوبونات خصم مع أكواد ترويجية يمكن تطبيقها عند الدفع. يمكن تحديد قيمة الخصم (نسبة أو مبلغ ثابت)، تاريخ الانتهاء، والحد الأدنى للطلب."),
    ("صفحة التواصل معنا", "إنشاء صفحة تواصل احترافية تحتوي على نموذج اتصال، معلومات الاتصال (عنوان المتجر، أرقام الهواتف، البريد الإلكتروني)، وخريطة الموقع باستخدام Google Maps."),
    ("نظام إرجاع واستبدال المنتجات", "توفير نظام متكامل لطلبات الإرجاع والاستبدال مع تحديد الأسباب المحتملة وسياسة الاسترجاع. يجب أن يتضمن النظام متابعة حالة طلب الإرجاع."),
    ("نظام النقاط والولاء", "برنامج نقاط مكافأة يحصل العميل من خلاله على نقاط عند كل عملية شراء يمكن استبدالها لاحقاً بخصومات أو منتجات مجانية. كل جنيه يساوي نقطة معينة."),
    ("إشعارات توفر المنتج", "عند نفاد منتج ما، يمكن للعملاء التسجيل للحصول على إشعار عند توفره مرة أخرى في المخزون، مما يزيد من فرص البيع ويحسن تجربة العميل."),
]

for title, desc in high_priority_features:
    story.append(Paragraph(arabic_text(f"• {title}"), feature_title_style))
    story.append(Paragraph(arabic_text(desc), body_style))
    story.append(Spacer(1, 8))

story.append(PageBreak())

# Section 2: Medium Priority Features
story.append(Paragraph(arabic_text("المميزات متوسطة الأولوية"), section_style))
story.append(Spacer(1, 10))

medium_priority_features = [
    ("البحث المتقدم والاقتراحات التلقائية", "تحسين محرك البحث بإضافة اقتراحات تلقائية أثناء الكتابة، والبحث بالأصوات المشابهة، والتصحيح التلقائي للأخطاء الإملائية. يمكن أيضاً إضافة بحث متقدم بفلاتر متعددة."),
    ("مقارنة المنتجات", "إضافة إمكانية مقارنة منتجين أو أكثر جنباً إلى جنب لعرض الاختلافات في السعر والمواصفات والميزات، مما يساعد العميل في اتخاذ قرار الشراء الصحيح."),
    ("المنتجات المُشاهدة مؤخراً", "عرض قائمة بالمنتجات التي شاهدها العميل مؤخراً في الصفحة الرئيسية أو في الشريط الجانبي، مما يسهل عليه العودة للمنتجات التي أثارت اهتمامه."),
    ("المشاركة على وسائل التواصل", "إضافة أزرار للمشاركة على فيسبوك، تويتر، واتساب وغيرها لكل منتج، مما يزيد من انتشار المتجر ويجلب عملاء جدد."),
    ("مركز المساعدة والأسئلة الشائعة", "إنشاء صفحة للأسئلة الشائعة تغطي المواضيع الأكثر شيوعاً مثل سياسة الشحن، طرق الدفع، سياسة الإرجاع، وكيفية استخدام الموقع."),
    ("المدونة والمقالات", "قسم مدونة يحتوي على مقالات تعليمية ونصائح حول المنتجات المكتبية والمدرسية، مما يحسن الترتيب في محركات البحث ويجذب زوار جدد."),
    ("صفحات قانونية", "إضافة الصفحات القانونية الضرورية مثل سياسة الخصوصية، شروط الاستخدام، وسياسة الإرجاع لضمان الشفافية والحماية القانونية."),
    ("الدردشة المباشرة", "إضافة أداة دردشة مباشرة للتواصل مع خدمة العملاء في الوقت الفعلي، يمكن أن تكون عبر بشر أو روبوت دردشة ذكي للإجابة على الأسئلة الشائعة."),
    ("إشعارات المخزون للإدارة", "نظام تنبيهات لمدير المتجر عندما ينخفض المخزون عن حد معين، مما يسمح بإعادة التوريد في الوقت المناسب ومنع نفاد المنتجات."),
    ("التكامل مع واتساب للأعمال", "إضافة زر واتساب عائم للتواصل السريع مع المتجر، يمكن استخدامه للاستفسارات أو لإتمام الطلبات خارج الموقع."),
]

for title, desc in medium_priority_features:
    story.append(Paragraph(arabic_text(f"• {title}"), feature_title_style))
    story.append(Paragraph(arabic_text(desc), body_style))
    story.append(Spacer(1, 8))

story.append(PageBreak())

# Section 3: Additional Features
story.append(Paragraph(arabic_text("مميزات إضافية مقترحة"), section_style))
story.append(Spacer(1, 10))

additional_features = [
    ("العروض المحدودة الوقت", "إنشاء نظام للعروض الخاصة محدودة الوقت (Flash Sales) مع عداد تنازلي يظهر الوقت المتبقي للعرض. هذا يخلق شعوراً بالإلحاح ويشجع على الشراء السريع."),
    ("حزم المنتجات", "إمكانية إنشاء حزم منتجات مجمعة بسعر مخفض (مثلاً: حقيبة مدرسية كاملة تحتوي على جميع المستلزمات) مما يزيد من قيمة الطلب الواحد."),
    ("نظام الهدايا وبطاقات الهدايا", "إضافة بطاقات هدايا رقمية يمكن شراؤها وإرسالها كهدية لأشخاص آخرين مع إمكانية تخصيص رسالة الهدية وتاريخ الإرسال."),
    ("تقارير المبيعات والإحصائيات", "لوحة تحكم متقدمة للإدارة تعرض تقارير مفصلة عن المبيعات، المنتجات الأكثر مبيعاً، إيرادات الفترات المختلفة، وتحليل سلوك العملاء."),
    ("التكامل مع المحاسبة", "ربط الموقع مع أنظمة المحاسبة لتصدير الفواتير والبيانات المالية تلقائياً، مما يوفر الوقت ويقلل الأخطاء اليدوية."),
    ("دعم الفيديو للمنتجات", "إضافة إمكانية رفع فيديوهات للمنتجات بالإضافة للصور، مما يعطي عرضاً أفضل للمنتج ويساعد في عملية الشراء."),
    ("المتجر المتعدد اللغات", "إضافة لغات أخرى مثل الإنجليزية والفرنسية للوصول لشريحة أكبر من العملاء، خاصة في السياحة والتصدير."),
    ("نظام الولاء للشركات", "برنامج خاص للشركات والمدارس التي تشتري بكميات كبيرة، مع أسعار جملة وخدمات مخصصة."),
    ("تطبيق الهاتف المحمول", "تطوير تطبيق للموبايل (iOS و Android) يوفر تجربة أفضل للهواتف مع إشعارات دفع ووصول سريع للمنتجات."),
    ("نظام التوصيات الذكي", "استخدام الذكاء الاصطناعي لاقتراح منتجات على العميل بناءً على سجل مشترياته وتصفحاته السابقة."),
]

for title, desc in additional_features:
    story.append(Paragraph(arabic_text(f"• {title}"), feature_title_style))
    story.append(Paragraph(arabic_text(desc), body_style))
    story.append(Spacer(1, 8))

story.append(PageBreak())

# Section 4: Technical Improvements
story.append(Paragraph(arabic_text("التحسينات التقنية"), section_style))
story.append(Spacer(1, 10))

technical_features = [
    ("تحسين SEO", "تحسين محركات البحث من خلال إضافة Meta Tags و Schema Markup للمنتجات، وتحسين سرعة الموقع، وإنشاء Sitemap و robots.txt لضمان فهرسة صحيحة."),
    ("تحسين الأداء", "تحسين سرعة تحميل الموقع من خلال ضغط الصور، استخدام CDN، وتحسين استعلامات قاعدة البيانات. السرعة عامل مهم في ترتيب Google وتجربة المستخدم."),
    ("نظام النسخ الاحتياطي", "إعداد نظام نسخ احتياطي تلقائي للبيانات والصور مع جدولة يومية وأسبوعية وشهرية لحماية البيانات من الفقدان."),
    ("الأمان والحماية", "تطوير نظام أمان متقدم يشمل حماية من هجمات DDoS، تشفير البيانات الحساسة، وتنفيذ Two-Factor Authentication للمستخدمين."),
    ("API للمطورين", "إنشاء API عام يمكن للمطورين استخدامه لبناء تطبيقات طرفية أو التكامل مع أنظمة أخرى."),
    ("نظام التخزين المؤقت", "تطبيق نظام Caching متقدم مثل Redis لتحسين أداء الموقع وتقليل الضغط على قاعدة البيانات خاصة في أوقات الذروة."),
]

for title, desc in technical_features:
    story.append(Paragraph(arabic_text(f"• {title}"), feature_title_style))
    story.append(Paragraph(arabic_text(desc), body_style))
    story.append(Spacer(1, 8))

story.append(Spacer(1, 20))

# Summary table
story.append(Paragraph(arabic_text("جدول ملخص الأولويات"), section_style))
story.append(Spacer(1, 10))

table_data = [
    [arabic_text('العدد'), arabic_text('التصنيف')],
    ['20', arabic_text('عالية الأولوية')],
    ['15', arabic_text('متوسطة الأولوية')],
    ['35', arabic_text('المجموع الكلي')],
]

summary_table = Table(table_data, colWidths=[150, 150])
summary_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, -1), 'Amiri'),
    ('FONTSIZE', (0, 0), (-1, -1), 11),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CCCCCC')),
    ('TOPPADDING', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#FFEBEE')),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#FFF3E0')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#E3F2FD')),
]))

story.append(summary_table)

# Build PDF
doc.build(story)
print("PDF generated successfully!")
