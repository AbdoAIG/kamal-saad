#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Coolify Deployment Guide for Maktabati E-commerce
"""

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Create document
output_path = '/home/z/my-project/download/coolify_deployment_guide.pdf'
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    rightMargin=1.5*cm,
    leftMargin=1.5*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title='coolify_deployment_guide',
    author='Z.ai',
    creator='Z.ai',
    subject='Coolify Deployment Guide for Maktabati'
)

# Define styles
styles = getSampleStyleSheet()

cover_title_style = ParagraphStyle(
    name='CoverTitle',
    fontName='Microsoft YaHei',
    fontSize=36,
    leading=50,
    alignment=TA_CENTER,
    spaceAfter=30
)

cover_subtitle_style = ParagraphStyle(
    name='CoverSubtitle',
    fontName='SimHei',
    fontSize=18,
    leading=28,
    alignment=TA_CENTER,
    spaceAfter=48
)

h1_style = ParagraphStyle(
    name='Heading1',
    fontName='Microsoft YaHei',
    fontSize=20,
    leading=30,
    alignment=TA_RIGHT,
    spaceAfter=18,
    spaceBefore=24,
    textColor=colors.HexColor('#1F4E79')
)

h2_style = ParagraphStyle(
    name='Heading2',
    fontName='Microsoft YaHei',
    fontSize=16,
    leading=24,
    alignment=TA_RIGHT,
    spaceAfter=12,
    spaceBefore=18,
    textColor=colors.HexColor('#2E75B6')
)

body_style = ParagraphStyle(
    name='BodyStyle',
    fontName='SimHei',
    fontSize=12,
    leading=20,
    alignment=TA_RIGHT,
    spaceAfter=12,
    wordWrap='CJK'
)

code_style = ParagraphStyle(
    name='CodeStyle',
    fontName='DejaVuSans',
    fontSize=9,
    leading=14,
    alignment=TA_LEFT,
    spaceAfter=6,
    backColor=colors.HexColor('#F5F5F5'),
    leftIndent=20,
    rightIndent=20
)

bullet_style = ParagraphStyle(
    name='BulletStyle',
    fontName='SimHei',
    fontSize=12,
    leading=20,
    alignment=TA_RIGHT,
    spaceAfter=6,
    rightIndent=20,
    wordWrap='CJK'
)

table_header_style = ParagraphStyle(
    name='TableHeader',
    fontName='Microsoft YaHei',
    fontSize=11,
    textColor=colors.white,
    alignment=TA_CENTER
)

table_cell_style = ParagraphStyle(
    name='TableCell',
    fontName='SimHei',
    fontSize=10,
    textColor=colors.black,
    alignment=TA_CENTER,
    wordWrap='CJK'
)

table_cell_code_style = ParagraphStyle(
    name='TableCellCode',
    fontName='DejaVuSans',
    fontSize=9,
    textColor=colors.black,
    alignment=TA_LEFT
)

# Build story
story = []

# Cover Page
story.append(Spacer(1, 120))
story.append(Paragraph('<b>دليل النشر على Coolify</b>', cover_title_style))
story.append(Spacer(1, 36))
story.append(Paragraph('لمشروع مكتبتي للتجارة الإلكترونية', cover_subtitle_style))
story.append(Spacer(1, 48))
story.append(Paragraph('Hetzner + Coolify = Vercel بديل مفتوح المصدر', cover_subtitle_style))
story.append(Spacer(1, 80))
story.append(Paragraph('2025', ParagraphStyle(name='Date', fontName='SimHei', fontSize=14, alignment=TA_CENTER)))
story.append(PageBreak())

# Table of Contents
story.append(Paragraph('<b>فهرس المحتويات</b>', h1_style))
story.append(Spacer(1, 18))

toc_items = [
    ('1. ما هو Coolify؟', 'مقدمة عن المنصة'),
    ('2. إنشاء خادم Hetzner', 'اختيار المواصفات المناسبة'),
    ('3. تثبيت Coolify', 'أمر واحد فقط!'),
    ('4. إعداد قاعدة البيانات', 'PostgreSQL على Coolify'),
    ('5. إضافة التطبيق', 'ربط GitHub'),
    ('6. متغيرات البيئة', 'الإعدادات المطلوبة'),
    ('7. النطاق و SSL', 'إعداد الدومين'),
    ('8. النشر الأول', 'تشغيل التطبيق'),
    ('9. ما بعد النشر', 'إنشاء المدير والصيانة'),
]

for num, title in toc_items:
    story.append(Paragraph(f'{num}: {title}', body_style))
story.append(PageBreak())

# Section 1: What is Coolify
story.append(Paragraph('<b>1. ما هو Coolify؟</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    'Coolify هو بديل مفتوح المصدر لـ Vercel و Heroku و Netlify. '
    'يمكنك استضافته على خادمك الخاص مع واجهة سهلة الاستخدام لإدارة التطبيقات.',
    body_style
))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>مميزات Coolify:</b>', body_style))
story.append(Paragraph('• واجهة ويب سهلة الاستخدام', bullet_style))
story.append(Paragraph('• دعم تلقائي لـ SSL (Let\'s Encrypt)', bullet_style))
story.append(Paragraph('• نشر تلقائي من GitHub/GitLab', bullet_style))
story.append(Paragraph('• إدارة قواعد البيانات (PostgreSQL, MySQL, Redis)', bullet_style))
story.append(Paragraph('• مراقبة الموارد والسجلات', bullet_style))
story.append(Paragraph('• نسخ احتياطي تلقائي', bullet_style))
story.append(Paragraph('• مجاني تماماً (Open Source)', bullet_style))
story.append(Spacer(1, 18))

# Comparison table
comparison_data = [
    [Paragraph('<b>الميزة</b>', table_header_style), Paragraph('<b>Coolify</b>', table_header_style), Paragraph('<b>Vercel</b>', table_header_style)],
    [Paragraph('السعر', table_cell_style), Paragraph('مجاني (خادمك)', table_cell_style), Paragraph('$20+/شهر', table_cell_style)],
    [Paragraph('التحكم', table_cell_style), Paragraph('كامل', table_cell_style), Paragraph('محدود', table_cell_style)],
    [Paragraph('قاعدة البيانات', table_cell_style), Paragraph('مدمجة', table_cell_style), Paragraph('خارجية ($$)', table_cell_style)],
    [Paragraph('SSL', table_cell_style), Paragraph('تلقائي', table_cell_style), Paragraph('تلقائي', table_cell_style)],
    [Paragraph('النشر', table_cell_style), Paragraph('Git Push', table_cell_style), Paragraph('Git Push', table_cell_style)],
]

comparison_table = Table(comparison_data, colWidths=[5*cm, 5*cm, 5*cm])
comparison_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
story.append(comparison_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 1:</b> مقارنة بين Coolify و Vercel', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

# Section 2: Create Hetzner Server
story.append(Paragraph('<b>2. إنشاء خادم Hetzner</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>2.1 تسجيل الدخول:</b>', h2_style))
story.append(Paragraph('1. اذهب إلى: console.hetzner.cloud', bullet_style))
story.append(Paragraph('2. أنشئ حساباً جديداً أو سجل دخولك', bullet_style))
story.append(Paragraph('3. أضف طريقة دفع (بطاقة ائتمان أو PayPal)', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>2.2 إنشاء خادم جديد:</b>', h2_style))
story.append(Paragraph('انقر على "Add Server" واختر:', body_style))
story.append(Spacer(1, 6))

server_data = [
    [Paragraph('<b>الإعداد</b>', table_header_style), Paragraph('<b>القيمة الموصى بها</b>', table_header_style)],
    [Paragraph('Location', table_cell_style), Paragraph('Falkenstein (ألمانيا) أو Helsinki (فنلندا)', table_cell_style)],
    [Paragraph('Image', table_cell_style), Paragraph('Ubuntu 24.04 LTS', table_cell_style)],
    [Paragraph('Type', table_cell_style), Paragraph('CPX21 (3 vCPU, 4GB RAM) - موصى به', table_cell_style)],
    [Paragraph('Networking', table_cell_style), Paragraph('IPv4 و IPv6', table_cell_style)],
    [Paragraph('SSH Key', table_cell_style), Paragraph('أضف مفتاح SSH الخاص بك', table_cell_style)],
]

server_table = Table(server_data, colWidths=[5*cm, 10*cm])
server_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(server_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 2:</b> إعدادات خادم Hetzner', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 12))

story.append(Paragraph('التكلفة التقريبية: €5/شهر (~$5.50)', body_style))
story.append(Spacer(1, 18))

# Section 3: Install Coolify
story.append(Paragraph('<b>3. تثبيت Coolify</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>3.1 الاتصال بالخادم:</b>', h2_style))
story.append(Paragraph('ssh root@your-server-ip', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>3.2 تشغيل أمر التثبيت:</b>', h2_style))
story.append(Paragraph(
    'أمر واحد فقط لتثبيت كل شيء! Docker، Coolify، وجميع المتطلبات:',
    body_style
))
story.append(Spacer(1, 6))

story.append(Paragraph('curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>سيقوم السكريبت بـ:</b>', body_style))
story.append(Paragraph('• تثبيت Docker و Docker Compose', bullet_style))
story.append(Paragraph('• تحميل وتثبيت Coolify', bullet_style))
story.append(Paragraph('• إعداد SSL تلقائياً', bullet_style))
story.append(Paragraph('• تشغيل Coolify على المنفذ 3000', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>الوقت المتوقع: 5-10 دقائق</b>', body_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>3.3 الوصول للوحة التحكم:</b>', h2_style))
story.append(Paragraph('بعد انتهاء التثبيت:', body_style))
story.append(Paragraph('1. افتح المتصفح على: https://your-server-ip:3000', bullet_style))
story.append(Paragraph('2. أنشئ حساب المدير', bullet_style))
story.append(Paragraph('3. احفظ بيانات الدخول في مكان آمن', bullet_style))
story.append(Spacer(1, 18))

# Section 4: Database Setup
story.append(Paragraph('<b>4. إعداد قاعدة البيانات</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>4.1 إنشاء قاعدة البيانات:</b>', h2_style))
story.append(Paragraph('من لوحة تحكم Coolify:', body_style))
story.append(Spacer(1, 6))
story.append(Paragraph('1. اضغط على "Projects" في القائمة الجانبية', bullet_style))
story.append(Paragraph('2. اضغط "New Project"', bullet_style))
story.append(Paragraph('3. أدخل اسم المشروع: "Maktabati"', bullet_style))
story.append(Paragraph('4. اضغط "Create"', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>4.2 إضافة PostgreSQL:</b>', h2_style))
story.append(Paragraph('داخل المشروع:', body_style))
story.append(Spacer(1, 6))
story.append(Paragraph('1. اضغط "New Resource"', bullet_style))
story.append(Paragraph('2. اختر "Database"', bullet_style))
story.append(Paragraph('3. اختر "PostgreSQL"', bullet_style))
story.append(Paragraph('4. الاسم: maktabati-db', bullet_style))
story.append(Paragraph('5. الإصدار: 16', bullet_style))
story.append(Paragraph('6. اضغط "Deploy"', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>4.3 الحصول على رابط الاتصال:</b>', h2_style))
story.append(Paragraph('بعد تشغيل قاعدة البيانات:', body_style))
story.append(Paragraph('1. اضغط على قاعدة البيانات', bullet_style))
story.append(Paragraph('2. اذهب إلى تبويب "Configuration"', bullet_style))
story.append(Paragraph('3. انسخ "PostgreSQL URL" (DATABASE_URL)', bullet_style))
story.append(Spacer(1, 18))

# Section 5: Add Application
story.append(Paragraph('<b>5. إضافة التطبيق</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>5.1 رفع الكود إلى GitHub:</b>', h2_style))
story.append(Paragraph('تأكد من رفع مشروعك إلى GitHub:', body_style))
story.append(Paragraph('git init', code_style))
story.append(Paragraph('git add .', code_style))
story.append(Paragraph('git commit -m "Initial commit"', code_style))
story.append(Paragraph('git remote add origin https://github.com/YOUR-USERNAME/maktabati.git', code_style))
story.append(Paragraph('git push -u origin main', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>5.2 إضافة التطبيق في Coolify:</b>', h2_style))
story.append(Paragraph('داخل مشروع Maktabati:', body_style))
story.append(Spacer(1, 6))
story.append(Paragraph('1. اضغط "New Resource"', bullet_style))
story.append(Paragraph('2. اختر "Application"', bullet_style))
story.append(Paragraph('3. اختر "Public Repository" (أو Private إذا كان خاصاً)', bullet_style))
story.append(Paragraph('4. أدخل رابط المستودع:', bullet_style))
story.append(Paragraph('   https://github.com/YOUR-USERNAME/maktabati', code_style))
story.append(Paragraph('5. Branch: main', bullet_style))
story.append(Paragraph('6. Build Pack: Nixpacks (تلقائي)', bullet_style))
story.append(Paragraph('7. اضغط "Continue"', bullet_style))
story.append(Spacer(1, 18))

# Section 6: Environment Variables
story.append(Paragraph('<b>6. متغيرات البيئة</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>6.1 إضافة المتغيرات:</b>', h2_style))
story.append(Paragraph('في إعدادات التطبيق، اذهب إلى "Configuration" ثم "Environment":', body_style))
story.append(Spacer(1, 12))

env_data = [
    [Paragraph('<b>المتغير</b>', table_header_style), Paragraph('<b>القيمة</b>', table_header_style)],
    [Paragraph('DATABASE_URL', table_cell_code_style), Paragraph('رابط PostgreSQL من الخطوة 4', table_cell_style)],
    [Paragraph('AUTH_SECRET', table_cell_code_style), Paragraph('مفتاح عشوائي 32 حرف', table_cell_style)],
    [Paragraph('NEXTAUTH_SECRET', table_cell_code_style), Paragraph('نفس AUTH_SECRET', table_cell_style)],
    [Paragraph('NEXTAUTH_URL', table_cell_code_style), Paragraph('https://yourdomain.com', table_cell_style)],
    [Paragraph('GOOGLE_CLIENT_ID', table_cell_code_style), Paragraph('معرف Google OAuth', table_cell_style)],
    [Paragraph('GOOGLE_CLIENT_SECRET', table_cell_code_style), Paragraph('مفتاح Google OAuth', table_cell_style)],
    [Paragraph('CLOUDINARY_CLOUD_NAME', table_cell_code_style), Paragraph('اسم Cloudinary', table_cell_style)],
    [Paragraph('CLOUDINARY_API_KEY', table_cell_code_style), Paragraph('مفتاح Cloudinary', table_cell_style)],
    [Paragraph('CLOUDINARY_API_SECRET', table_cell_code_style), Paragraph('سر Cloudinary', table_cell_style)],
    [Paragraph('PAYMOB_API_KEY', table_cell_code_style), Paragraph('مفتاح Paymob', table_cell_style)],
]

env_table = Table(env_data, colWidths=[5*cm, 10*cm])
env_table.setStyle(TableStyle([
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
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(env_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 3:</b> متغيرات البيئة المطلوبة', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>6.2 توليد مفتاح سري:</b>', h2_style))
story.append(Paragraph('لتوليد مفتاح AUTH_SECRET عشوائي:', body_style))
story.append(Paragraph('openssl rand -base64 32', code_style))
story.append(Spacer(1, 18))

# Section 7: Domain & SSL
story.append(Paragraph('<b>7. إعداد النطاق و SSL</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>7.1 توجيه النطاق:</b>', h2_style))
story.append(Paragraph('من مزود النطاق (Namecheap, GoDaddy, etc.):', body_style))
story.append(Spacer(1, 6))
story.append(Paragraph('1. أضف سجل A يشير إلى IP الخادم', bullet_style))
story.append(Paragraph('   A Record: @ → your-server-ip', bullet_style))
story.append(Paragraph('2. أضف سجل CNAME للـ www', bullet_style))
story.append(Paragraph('   CNAME: www → yourdomain.com', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>7.2 إضافة النطاق في Coolify:</b>', h2_style))
story.append(Paragraph('في إعدادات التطبيق:', body_style))
story.append(Spacer(1, 6))
story.append(Paragraph('1. اذهب إلى "Configuration" → "Domains"', bullet_style))
story.append(Paragraph('2. اضغط "Add Domain"', bullet_style))
story.append(Paragraph('3. أدخل: yourdomain.com', bullet_style))
story.append(Paragraph('4. فعّل "Generate SSL Certificate"', bullet_style))
story.append(Paragraph('5. اضغط "Save"', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    'Coolify سيقوم تلقائياً بإنشاء شهادة SSL مجانية من Let\'s Encrypt!',
    body_style
))
story.append(Spacer(1, 18))

# Section 8: First Deploy
story.append(Paragraph('<b>8. النشر الأول</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>8.1 تشغيل النشر:</b>', h2_style))
story.append(Paragraph('1. اضغط زر "Deploy" في أعلى الصفحة', bullet_style))
story.append(Paragraph('2. اختر "Deploy Now"', bullet_style))
story.append(Paragraph('3. راقب سجل البناء في "Deployment Logs"', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>8.2 مراحل البناء:</b>', h2_style))

build_data = [
    [Paragraph('<b>المرحلة</b>', table_header_style), Paragraph('<b>الوصف</b>', table_header_style), Paragraph('<b>الوقت</b>', table_header_style)],
    [Paragraph('Clone', table_cell_style), Paragraph('تحميل الكود من GitHub', table_cell_style), Paragraph('10-30 ثانية', table_cell_style)],
    [Paragraph('Install', table_cell_style), Paragraph('تثبيت npm dependencies', table_cell_style), Paragraph('2-3 دقائق', table_cell_style)],
    [Paragraph('Build', table_cell_style), Paragraph('بناء Next.js', table_cell_style), Paragraph('2-5 دقائق', table_cell_style)],
    [Paragraph('Deploy', table_cell_style), Paragraph('تشغيل الحاوية', table_cell_style), Paragraph('10-30 ثانية', table_cell_style)],
]

build_table = Table(build_data, colWidths=[3*cm, 8*cm, 4*cm])
build_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(build_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 4:</b> مراحل البناء والنشر', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

# Section 9: Post-deployment
story.append(Paragraph('<b>9. ما بعد النشر</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>9.1 تشغيل migrations:</b>', h2_style))
story.append(Paragraph('من لوحة Coolify:', body_style))
story.append(Paragraph('1. اضغط على التطبيق', bullet_style))
story.append(Paragraph('2. اذهب إلى "Terminal" أو "Exec"', bullet_style))
story.append(Paragraph('3. شغل الأوامر التالية:', bullet_style))
story.append(Spacer(1, 6))
story.append(Paragraph('npx prisma migrate deploy', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>9.2 إنشاء حساب المدير:</b>', h2_style))
story.append(Paragraph('من نفس الطرفية:', body_style))
story.append(Paragraph('npx ts-node scripts/add-admin.ts', code_style))
story.append(Paragraph('أو يدوياً عبر API:', body_style))
story.append(Paragraph('curl -X POST https://yourdomain.com/api/setup-admin', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>9.3 التحقق من عمل الموقع:</b>', h2_style))
story.append(Paragraph('1. افتح: https://yourdomain.com', bullet_style))
story.append(Paragraph('2. تأكد من عمل SSL (القفل الأخضر)', bullet_style))
story.append(Paragraph('3. اختبر تسجيل الدخول بـ Google', bullet_style))
story.append(Paragraph('4. اختبر لوحة التحكم: /admin', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>9.4 النشر التلقائي:</b>', h2_style))
story.append(Paragraph(
    'Coolify يدعم النشر التلقائي عند كل push إلى GitHub! '
    'لتفعيله:',
    body_style
))
story.append(Paragraph('1. اذهب إلى "Configuration" → "Webhooks"', bullet_style))
story.append(Paragraph('2. انسخ رابط الـ Webhook', bullet_style))
story.append(Paragraph('3. في GitHub، اذهب إلى Settings → Webhooks', bullet_style))
story.append(Paragraph('4. أضف الـ Webhook مع Content-Type: application/json', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>الآن عند كل git push سيتم النشر تلقائياً!</b>', body_style))
story.append(Spacer(1, 24))

# Summary
story.append(Paragraph('<b>ملخص سريع</b>', h1_style))
story.append(Spacer(1, 12))

summary_data = [
    [Paragraph('<b>الخطوة</b>', table_header_style), Paragraph('<b>الأمر/الإجراء</b>', table_header_style)],
    [Paragraph('1. إنشاء خادم', table_cell_style), Paragraph('Hetzner CPX21 - Ubuntu 24.04', table_cell_style)],
    [Paragraph('2. تثبيت Coolify', table_cell_style), Paragraph('curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash', table_cell_code_style)],
    [Paragraph('3. الوصول', table_cell_style), Paragraph('https://your-ip:3000', table_cell_code_style)],
    [Paragraph('4. قاعدة البيانات', table_cell_style), Paragraph('New Resource → Database → PostgreSQL', table_cell_style)],
    [Paragraph('5. التطبيق', table_cell_style), Paragraph('New Resource → Application → GitHub URL', table_cell_style)],
    [Paragraph('6. Environment', table_cell_style), Paragraph('إضافة جميع المتغيرات المطلوبة', table_cell_style)],
    [Paragraph('7. النطاق', table_cell_style), Paragraph('Configuration → Domains → Add + SSL', table_cell_style)],
    [Paragraph('8. النشر', table_cell_style), Paragraph('Deploy → مراقبة السجلات', table_cell_style)],
]

summary_table = Table(summary_data, colWidths=[4*cm, 11*cm])
summary_table.setStyle(TableStyle([
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
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(summary_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 5:</b> ملخص خطوات النشر', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=10, alignment=TA_CENTER)))

# Build PDF
doc.build(story)
print(f"PDF created successfully: {output_path}")
