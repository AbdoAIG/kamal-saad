#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Hetzner Deployment Guide for Maktabati E-commerce
"""

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.lib import colors
from reportlab.lib.units import cm, inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import os

# Register fonts
pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/chinese/SimHei.ttf'))
pdfmetrics.registerFont(TTFont('Microsoft YaHei', '/usr/share/fonts/truetype/chinese/msyh.ttf'))
pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

# Register font families
registerFontFamily('Microsoft YaHei', normal='Microsoft YaHei', bold='Microsoft YaHei')
registerFontFamily('SimHei', normal='SimHei', bold='SimHei')
registerFontFamily('Times New Roman', normal='Times New Roman', bold='Times New Roman')

# Create document
output_path = '/home/z/my-project/download/hetzner_deployment_guide.pdf'
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    rightMargin=1.5*cm,
    leftMargin=1.5*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title='hetzner_deployment_guide',
    author='Z.ai',
    creator='Z.ai',
    subject='Hetzner Deployment Guide for Maktabati E-commerce'
)

# Define styles
styles = getSampleStyleSheet()

# Cover title style
cover_title_style = ParagraphStyle(
    name='CoverTitle',
    fontName='Microsoft YaHei',
    fontSize=36,
    leading=50,
    alignment=TA_CENTER,
    spaceAfter=30
)

# Cover subtitle style
cover_subtitle_style = ParagraphStyle(
    name='CoverSubtitle',
    fontName='SimHei',
    fontSize=18,
    leading=28,
    alignment=TA_CENTER,
    spaceAfter=48
)

# Heading 1 style
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

# Heading 2 style
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

# Body style (Arabic)
body_style = ParagraphStyle(
    name='BodyStyle',
    fontName='SimHei',
    fontSize=12,
    leading=20,
    alignment=TA_RIGHT,
    spaceAfter=12,
    wordWrap='CJK'
)

# Code style
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

# Bullet style
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

# Table header style
table_header_style = ParagraphStyle(
    name='TableHeader',
    fontName='Microsoft YaHei',
    fontSize=11,
    textColor=colors.white,
    alignment=TA_CENTER
)

# Table cell style
table_cell_style = ParagraphStyle(
    name='TableCell',
    fontName='SimHei',
    fontSize=10,
    textColor=colors.black,
    alignment=TA_CENTER,
    wordWrap='CJK'
)

# Table cell style for code
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
story.append(Paragraph('<b>دليل النشر على Hetzner</b>', cover_title_style))
story.append(Spacer(1, 36))
story.append(Paragraph('لمشروع مكتبتي للتجارة الإلكترونية', cover_subtitle_style))
story.append(Spacer(1, 48))
story.append(Paragraph('Next.js 16 + PostgreSQL + Docker', cover_subtitle_style))
story.append(Spacer(1, 80))
story.append(Paragraph('2025', ParagraphStyle(name='Date', fontName='SimHei', fontSize=14, alignment=TA_CENTER)))
story.append(PageBreak())

# Table of Contents
story.append(Paragraph('<b>فهرس المحتويات</b>', h1_style))
story.append(Spacer(1, 18))

toc_items = [
    ('1. مقدمة', 'لماذا Hetzner؟'),
    ('2. متطلبات ما قبل النشر', 'التحضيرات اللازمة'),
    ('3. إعداد الخادم', 'تثبيت Docker والبرامج الأساسية'),
    ('4. تكوين المشروع', 'ملفات Docker و Nginx'),
    ('5. الحصول على شهادة SSL', 'Let\'s Encrypt'),
    ('6. النشر الأول', 'تشغيل التطبيق'),
    ('7. الصيانة والمراقبة', 'التحديثات والنسخ الاحتياطي'),
    ('8. استكشاف الأخطاء', 'حلول المشاكل الشائعة'),
]

for num, title in toc_items:
    story.append(Paragraph(f'{num}: {title}', body_style))
story.append(PageBreak())

# Section 1: Introduction
story.append(Paragraph('<b>1. مقدمة - لماذا Hetzner؟</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    'Hetzner هو مزود استضافة ألمانية يتميز بأسعار تنافسية جداً وجودة عالية. '
    'يوفر خوادم سحابية (Cloud) وخوادم مخصصة (Dedicated) بأسعار أقل بكثير من AWS و Google Cloud و DigitalOcean.',
    body_style
))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>مميزات Hetzner:</b>', body_style))
story.append(Paragraph('• أسعار تنافسية: خوادم قوية تبدأ من 4 يورو شهرياً', bullet_style))
story.append(Paragraph('• مراكز بيانات في أوروبا (ألمانيا، فنلندا) والولايات المتحدة', bullet_style))
story.append(Paragraph('• أداء عالي مع معالجات AMD EPYC وذاكرة DDR4', bullet_style))
story.append(Paragraph('• دعم IPv6 مجاني', bullet_style))
story.append(Paragraph('• لوحة تحكم بسيطة وسهلة الاستخدام', bullet_style))
story.append(Paragraph('• دعم فني متميز عبر التذاكر', bullet_style))
story.append(Spacer(1, 18))

# Comparison table
comparison_data = [
    [Paragraph('<b>الميزة</b>', table_header_style), Paragraph('<b>Hetzner</b>', table_header_style), Paragraph('<b>Vercel</b>', table_header_style)],
    [Paragraph('السعر', table_cell_style), Paragraph('ثابت شهرياً', table_cell_style), Paragraph('حسب الاستخدام', table_cell_style)],
    [Paragraph('التحكم', table_cell_style), Paragraph('كامل (root)', table_cell_style), Paragraph('محدود', table_cell_style)],
    [Paragraph('قاعدة البيانات', table_cell_style), Paragraph('محلية أو خارجية', table_cell_style), Paragraph('خارجية فقط', table_cell_style)],
    [Paragraph('SSL', table_cell_style), Paragraph('مجاني (Let\'s Encrypt)', table_cell_style), Paragraph('مجاني (تلقائي)', table_cell_style)],
    [Paragraph('التوسع', table_cell_style), Paragraph('يدوي', table_cell_style), Paragraph('تلقائي', table_cell_style)],
    [Paragraph('الصيانة', table_cell_style), Paragraph('مسؤوليتك', table_cell_style), Paragraph('تلقائية', table_cell_style)],
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
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
]))
story.append(comparison_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 1:</b> مقارنة بين Hetzner و Vercel', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

# Section 2: Pre-deployment Requirements
story.append(Paragraph('<b>2. متطلبات ما قبل النشر</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>2.1 إنشاء حساب Hetzner:</b>', h2_style))
story.append(Paragraph('1. قم بزيارة موقع hetzner.com وإنشاء حساب جديد', bullet_style))
story.append(Paragraph('2. أضف طريقة دفع (بطاقة ائتمان أو PayPal)', bullet_style))
story.append(Paragraph('3. انتقل إلى Console لإنشاء خادم جديد', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>2.2 اختيار الخادم المناسب:</b>', h2_style))

server_data = [
    [Paragraph('<b>الخطة</b>', table_header_style), Paragraph('<b>المواصفات</b>', table_header_style), Paragraph('<b>السعر</b>', table_header_style), Paragraph('<b>مناسب لـ</b>', table_header_style)],
    [Paragraph('CX22', table_cell_style), Paragraph('2 vCPU, 4GB RAM', table_cell_style), Paragraph('4 يورو/شهر', table_cell_style), Paragraph('مواقع صغيرة', table_cell_style)],
    [Paragraph('CX32', table_cell_style), Paragraph('4 vCPU, 8GB RAM', table_cell_style), Paragraph('8 يورو/شهر', table_cell_style), Paragraph('متوسط الحجم', table_cell_style)],
    [Paragraph('CX42', table_cell_style), Paragraph('8 vCPU, 16GB RAM', table_cell_style), Paragraph('16 يورو/شهر', table_cell_style), Paragraph('كبير', table_cell_style)],
    [Paragraph('CPX21', table_cell_style), Paragraph('3 vCPU, 4GB RAM', table_cell_style), Paragraph('5 يورو/شهر', table_cell_style), Paragraph('موصى به', table_cell_style)],
]

server_table = Table(server_data, colWidths=[3*cm, 5*cm, 3.5*cm, 3.5*cm])
server_table.setStyle(TableStyle([
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
story.append(server_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 2:</b> خطط Hetzner Cloud المتاحة', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

story.append(Paragraph('<b>2.3 إعدادات الخادم:</b>', h2_style))
story.append(Paragraph('• نظام التشغيل: Ubuntu 24.04 LTS', bullet_style))
story.append(Paragraph('• الموقع: Falkenstein (ألمانيا) أو Helsinki (فنلندا)', bullet_style))
story.append(Paragraph('• الشبكة: فعّل IPv4 و IPv6', bullet_style))
story.append(Paragraph('• SSH Key: أضف مفتاح SSH للوصول الآمن', bullet_style))
story.append(Spacer(1, 18))

# Section 3: Server Setup
story.append(Paragraph('<b>3. إعداد الخادم</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>3.1 الاتصال بالخادم:</b>', h2_style))
story.append(Paragraph('ssh root@your-server-ip', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>3.2 تشغيل سكريبت الإعداد:</b>', h2_style))
story.append(Paragraph(
    'يمكنك استخدام سكريبت الإعداد المرفق مع المشروع لتثبيت جميع البرامج المطلوبة تلقائياً:',
    body_style
))
story.append(Paragraph('chmod +x scripts/setup-server.sh', code_style))
story.append(Paragraph('sudo ./scripts/setup-server.sh', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>3.3 التثبيت اليدوي:</b>', h2_style))
story.append(Paragraph('إذا كنت تفضل التثبيت اليدوي، اتبع الخطوات التالية:', body_style))
story.append(Spacer(1, 6))

story.append(Paragraph('# تحديث النظام', code_style))
story.append(Paragraph('apt update && apt upgrade -y', code_style))
story.append(Spacer(1, 6))

story.append(Paragraph('# تثبيت Docker', code_style))
story.append(Paragraph('curl -fsSL https://get.docker.com | sh', code_style))
story.append(Paragraph('systemctl enable docker', code_style))
story.append(Paragraph('systemctl start docker', code_style))
story.append(Spacer(1, 6))

story.append(Paragraph('# تثبيت Docker Compose', code_style))
story.append(Paragraph('apt install docker-compose-plugin -y', code_style))
story.append(Spacer(1, 6))

story.append(Paragraph('# إعداد جدار الحماية', code_style))
story.append(Paragraph('ufw allow 22/tcp', code_style))
story.append(Paragraph('ufw allow 80/tcp', code_style))
story.append(Paragraph('ufw allow 443/tcp', code_style))
story.append(Paragraph('ufw enable', code_style))
story.append(Spacer(1, 18))

# Section 4: Project Configuration
story.append(Paragraph('<b>4. تكوين المشروع</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>4.1 هيكل الملفات:</b>', h2_style))

files_data = [
    [Paragraph('<b>الملف</b>', table_header_style), Paragraph('<b>الوصف</b>', table_header_style)],
    [Paragraph('Dockerfile', table_cell_code_style), Paragraph('ملف بناء صورة Docker للتطبيق', table_cell_style)],
    [Paragraph('docker-compose.yml', table_cell_code_style), Paragraph('تكوين جميع الخدمات', table_cell_style)],
    [Paragraph('nginx/nginx.conf', table_cell_code_style), Paragraph('إعدادات Nginx الأساسية', table_cell_style)],
    [Paragraph('nginx/conf.d/maktabati.conf', table_cell_code_style), Paragraph('إعدادات الموقع', table_cell_style)],
    [Paragraph('.dockerignore', table_cell_code_style), Paragraph('ملفات مستثناة من Docker', table_cell_style)],
]

files_table = Table(files_data, colWidths=[6*cm, 9*cm])
files_table.setStyle(TableStyle([
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
story.append(files_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 3:</b> ملفات التكوين المطلوبة', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

story.append(Paragraph('<b>4.2 متغيرات البيئة:</b>', h2_style))
story.append(Paragraph('أنشئ ملف .env في المسار الرئيسي للمشروع:', body_style))
story.append(Spacer(1, 6))

env_data = [
    [Paragraph('<b>المتغير</b>', table_header_style), Paragraph('<b>الوصف</b>', table_header_style)],
    [Paragraph('DATABASE_URL', table_cell_code_style), Paragraph('رابط قاعدة البيانات PostgreSQL', table_cell_style)],
    [Paragraph('AUTH_SECRET', table_cell_code_style), Paragraph('مفتاح التشفير (32 حرف على الأقل)', table_cell_style)],
    [Paragraph('NEXTAUTH_URL', table_cell_code_style), Paragraph('رابط الموقع (https://yourdomain.com)', table_cell_style)],
    [Paragraph('GOOGLE_CLIENT_ID', table_cell_code_style), Paragraph('معرف عميل Google OAuth', table_cell_style)],
    [Paragraph('GOOGLE_CLIENT_SECRET', table_cell_code_style), Paragraph('مفتاح عميل Google OAuth', table_cell_style)],
    [Paragraph('PAYMOB_API_KEY', table_cell_code_style), Paragraph('مفتاح Paymob للدفع', table_cell_style)],
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
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(env_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 4:</b> متغيرات البيئة الأساسية', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

# Section 5: SSL Certificate
story.append(Paragraph('<b>5. الحصول على شهادة SSL</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>5.1 إعداد Nginx مؤقتاً:</b>', h2_style))
story.append(Paragraph('# إنشاء مجلدات الشهادات', code_style))
story.append(Paragraph('mkdir -p certbot/conf certbot/www', code_style))
story.append(Spacer(1, 6))

story.append(Paragraph('# تشغيل Nginx مؤقتاً للحصول على الشهادة', code_style))
story.append(Paragraph('docker run -d --name temp-nginx -p 80:80 \\', code_style))
story.append(Paragraph('  -v $(pwd)/certbot/www:/var/www/certbot \\', code_style))
story.append(Paragraph('  nginx:alpine', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>5.2 الحصول على الشهادة:</b>', h2_style))
story.append(Paragraph('docker run -it --rm \\', code_style))
story.append(Paragraph('  -v $(pwd)/certbot/conf:/etc/letsencrypt \\', code_style))
story.append(Paragraph('  -v $(pwd)/certbot/www:/var/www/certbot \\', code_style))
story.append(Paragraph('  certbot/certbot certonly --webroot \\', code_style))
story.append(Paragraph('  -w /var/www/certbot \\', code_style))
story.append(Paragraph('  -d yourdomain.com -d www.yourdomain.com \\', code_style))
story.append(Paragraph('  --email your@email.com --agree-tos', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>5.3 تحديث إعدادات Nginx:</b>', h2_style))
story.append(Paragraph(
    'بعد الحصول على الشهادة، قم بتحديث ملف nginx/conf.d/maktabati.conf '
    'وغير yourdomain.com إلى نطاقك الفعلي.',
    body_style
))
story.append(Spacer(1, 18))

# Section 6: First Deployment
story.append(Paragraph('<b>6. النشر الأول</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>6.1 نسخ المشروع:</b>', h2_style))
story.append(Paragraph('# باستخدام Git', code_style))
story.append(Paragraph('git clone https://github.com/your-username/maktabati.git /opt/maktabati', code_style))
story.append(Paragraph('cd /opt/maktabati', code_style))
story.append(Spacer(1, 6))

story.append(Paragraph('# أو باستخدام SCP', code_style))
story.append(Paragraph('scp -r ./maktabati root@your-server:/opt/', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>6.2 إنشاء ملف .env:</b>', h2_style))
story.append(Paragraph('nano .env', code_style))
story.append(Paragraph(
    'أضف جميع متغيرات البيئة المطلوبة واحفظ الملف.',
    body_style
))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>6.3 تشغيل التطبيق:</b>', h2_style))
story.append(Paragraph('# بناء وتشغيل الحاويات', code_style))
story.append(Paragraph('docker compose up -d --build', code_style))
story.append(Spacer(1, 6))

story.append(Paragraph('# التحقق من حالة الحاويات', code_style))
story.append(Paragraph('docker compose ps', code_style))
story.append(Spacer(1, 6))

story.append(Paragraph('# عرض السجلات', code_style))
story.append(Paragraph('docker compose logs -f app', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>6.4 تشغيل迁移ات قاعدة البيانات:</b>', h2_style))
story.append(Paragraph('docker compose exec app npx prisma migrate deploy', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>6.5 إنشاء حساب المدير:</b>', h2_style))
story.append(Paragraph('docker compose exec app npx ts-node scripts/add-admin.ts', code_style))
story.append(Spacer(1, 18))

# Section 7: Maintenance
story.append(Paragraph('<b>7. الصيانة والمراقبة</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>7.1 تحديث التطبيق:</b>', h2_style))
story.append(Paragraph('# سحب أحدث التغييرات', code_style))
story.append(Paragraph('git pull origin main', code_style))
story.append(Spacer(1, 6))

story.append(Paragraph('# إعادة البناء والتشغيل', code_style))
story.append(Paragraph('docker compose up -d --build', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>7.2 النسخ الاحتياطي:</b>', h2_style))
story.append(Paragraph('# نسخ احتياطي لقاعدة البيانات', code_style))
story.append(Paragraph('docker compose exec app npx prisma db pull', code_style))
story.append(Paragraph('pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>7.3 مراقبة الموارد:</b>', h2_style))
story.append(Paragraph('# عرض استخدام الموارد', code_style))
story.append(Paragraph('docker stats', code_style))
story.append(Spacer(1, 6))

story.append(Paragraph('# عرض مساحة القرص', code_style))
story.append(Paragraph('df -h', code_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>7.4 تجديد شهادة SSL:</b>', h2_style))
story.append(Paragraph(
    'يتم التجديد التلقائي كل 12 ساعة عبر حاوية Certbot. '
    'للتجديد اليدوي:',
    body_style
))
story.append(Paragraph('docker compose exec certbot renew', code_style))
story.append(Paragraph('docker compose restart nginx', code_style))
story.append(Spacer(1, 18))

# Section 8: Troubleshooting
story.append(Paragraph('<b>8. استكشاف الأخطاء</b>', h1_style))
story.append(Spacer(1, 12))

errors_data = [
    [Paragraph('<b>المشكلة</b>', table_header_style), Paragraph('<b>الحل</b>', table_header_style)],
    [Paragraph('التطبيق لا يعمل', table_cell_style), Paragraph('تحقق من السجلات: docker compose logs app', table_cell_style)],
    [Paragraph('خطأ في قاعدة البيانات', table_cell_style), Paragraph('تحقق من DATABASE_URL وحالة الاتصال', table_cell_style)],
    [Paragraph('SSL لا يعمل', table_cell_style), Paragraph('تحقق من مسارات الشهادات في nginx conf', table_cell_style)],
    [Paragraph('OAuth لا يعمل', table_cell_style), Paragraph('تحقق من NEXTAUTH_URL وإعدادات Google', table_cell_style)],
    [Paragraph('الذاكرة ممتلئة', table_cell_style), Paragraph('docker system prune -a لتنظيف الصور', table_cell_style)],
]

errors_table = Table(errors_data, colWidths=[5*cm, 10*cm])
errors_table.setStyle(TableStyle([
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
story.append(errors_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 5:</b> حلول المشاكل الشائعة', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=10, alignment=TA_CENTER)))
story.append(Spacer(1, 24))

# Final notes
story.append(Paragraph('<b>ملاحظات ختامية</b>', h1_style))
story.append(Spacer(1, 12))
story.append(Paragraph(
    '• احتفظ بنسخة احتياطية من ملف .env في مكان آمن',
    bullet_style
))
story.append(Paragraph(
    '• راقب استهلاك الموارد بانتظام عبر docker stats',
    bullet_style
))
story.append(Paragraph(
    '• قم بتحديث النظام دورياً: apt update && apt upgrade',
    bullet_style
))
story.append(Paragraph(
    '• استخدم Fail2ban للحماية من هجمات brute force',
    bullet_style
))
story.append(Paragraph(
    '• تأكد من عمل النسخ الاحتياطي التلقائي لقاعدة البيانات',
    bullet_style
))

# Build PDF
doc.build(story)
print(f"PDF created successfully: {output_path}")
