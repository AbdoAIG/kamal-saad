#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Maktabati E-commerce - Enterprise Readiness Report
تقرير جاهزية المشروع للبيع لشركة كبيرة
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
output_path = '/home/z/my-project/download/maktabati_enterprise_readiness_report.pdf'
doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    rightMargin=1.5*cm,
    leftMargin=1.5*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title='maktabati_enterprise_readiness_report',
    author='Z.ai',
    creator='Z.ai',
    subject='تقرير جاهزية مشروع مكتبتي للمستوى المؤسسي'
)

# Define styles
styles = getSampleStyleSheet()

cover_title_style = ParagraphStyle(
    name='CoverTitle',
    fontName='Microsoft YaHei',
    fontSize=32,
    leading=45,
    alignment=TA_CENTER,
    spaceAfter=30
)

cover_subtitle_style = ParagraphStyle(
    name='CoverSubtitle',
    fontName='SimHei',
    fontSize=16,
    leading=24,
    alignment=TA_CENTER,
    spaceAfter=36
)

h1_style = ParagraphStyle(
    name='Heading1',
    fontName='Microsoft YaHei',
    fontSize=18,
    leading=28,
    alignment=TA_RIGHT,
    spaceAfter=16,
    spaceBefore=20,
    textColor=colors.HexColor('#1F4E79')
)

h2_style = ParagraphStyle(
    name='Heading2',
    fontName='Microsoft YaHei',
    fontSize=14,
    leading=22,
    alignment=TA_RIGHT,
    spaceAfter=12,
    spaceBefore=16,
    textColor=colors.HexColor('#2E75B6')
)

body_style = ParagraphStyle(
    name='BodyStyle',
    fontName='SimHei',
    fontSize=11,
    leading=18,
    alignment=TA_RIGHT,
    spaceAfter=10,
    wordWrap='CJK'
)

bullet_style = ParagraphStyle(
    name='BulletStyle',
    fontName='SimHei',
    fontSize=11,
    leading=18,
    alignment=TA_RIGHT,
    spaceAfter=6,
    rightIndent=15,
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
    leftIndent=15,
    rightIndent=15
)

table_header_style = ParagraphStyle(
    name='TableHeader',
    fontName='Microsoft YaHei',
    fontSize=10,
    textColor=colors.white,
    alignment=TA_CENTER
)

table_cell_style = ParagraphStyle(
    name='TableCell',
    fontName='SimHei',
    fontSize=9,
    textColor=colors.black,
    alignment=TA_CENTER,
    wordWrap='CJK'
)

table_cell_right_style = ParagraphStyle(
    name='TableCellRight',
    fontName='SimHei',
    fontSize=9,
    textColor=colors.black,
    alignment=TA_RIGHT,
    wordWrap='CJK'
)

# Build story
story = []

# Cover Page
story.append(Spacer(1, 100))
story.append(Paragraph('<b>تقرير جاهزية المشروع</b>', cover_title_style))
story.append(Paragraph('<b>للمستوى المؤسسي</b>', cover_title_style))
story.append(Spacer(1, 30))
story.append(Paragraph('مكتبتي - متجر الأدوات المكتبية والمدرسية', cover_subtitle_style))
story.append(Spacer(1, 24))
story.append(Paragraph('Maktabati E-commerce Platform', cover_subtitle_style))
story.append(Spacer(1, 60))

# Score box
score_data = [
    [Paragraph('<b>درجة الجاهزية الإجمالية</b>', table_header_style)],
    [Paragraph('<b>72%</b>', ParagraphStyle(name='ScoreStyle', fontName='Microsoft YaHei', fontSize=36, alignment=TA_CENTER, textColor=colors.HexColor('#1F4E79')))],
]
score_table = Table(score_data, colWidths=[10*cm])
score_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F0F8FF')),
    ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#1F4E79')),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 15),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
]))
story.append(score_table)

story.append(Spacer(1, 60))
story.append(Paragraph('2025', ParagraphStyle(name='Date', fontName='SimHei', fontSize=14, alignment=TA_CENTER)))
story.append(PageBreak())

# Table of Contents
story.append(Paragraph('<b>فهرس المحتويات</b>', h1_style))
story.append(Spacer(1, 12))

toc_items = [
    '1. ملخص تنفيذي',
    '2. تقييم الميزات الحالية',
    '3. الفجوات الحرجة',
    '4. متطلبات الأمان المؤسسي',
    '5. تحسينات الأداء',
    '6. التوثيق والدعم',
    '7. خطة العمل المقترحة',
    '8. التوصيات النهائية',
]

for item in toc_items:
    story.append(Paragraph(item, body_style))
story.append(PageBreak())

# Section 1: Executive Summary
story.append(Paragraph('<b>1. ملخص تنفيذي</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    'مشروع مكتبتي هو متجر إلكتروني متكامل للأدوات المكتبية والمدرسية، مبني باستخدام أحدث التقنيات '
    '(Next.js 16, TypeScript, PostgreSQL, Prisma). يقدم المشروع مجموعة شاملة من الميزات الأساسية '
    'للتجارة الإلكترونية مع لوحة تحكم متقدمة ونظام دفع متكامل.',
    body_style
))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>نقاط القوة الرئيسية:</b>', body_style))
story.append(Paragraph('• بنية تقنية حديثة وقابلة للتوسع', bullet_style))
story.append(Paragraph('• نظام مصادقة متعدد (Google OAuth + Email/Password)', bullet_style))
story.append(Paragraph('• تكامل مع Paymob للدفع الإلكتروني', bullet_style))
story.append(Paragraph('• لوحة تحكم شاملة مع نظام صلاحيات متقدم', bullet_style))
story.append(Paragraph('• دعم ثنائي اللغة (العربية والإنجليزية)', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>الفجوات الرئيسية:</b>', body_style))
story.append(Paragraph('• نقص في التوثيق التقني والتجاري', bullet_style))
story.append(Paragraph('• تحسينات أمنية مطلوبة للمستوى المؤسسي', bullet_style))
story.append(Paragraph('• ميزات متقدمة مفقودة (توصيات ذكية، استرداد السلات)', bullet_style))
story.append(Paragraph('• ضعف في التكامل مع أدوات التحليل والتسويق', bullet_style))
story.append(Spacer(1, 18))

# Section 2: Current Features Evaluation
story.append(Paragraph('<b>2. تقييم الميزات الحالية</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>2.1 واجهة المتجر:</b>', h2_style))

features_data = [
    [Paragraph('<b>الميزة</b>', table_header_style), Paragraph('<b>الحالة</b>', table_header_style), Paragraph('<b>الجودة</b>', table_header_style)],
    [Paragraph('صفحة الرئيسية', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('95%', table_cell_style)],
    [Paragraph('صفحة المنتج', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('90%', table_cell_style)],
    [Paragraph('سلة التسوق', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('95%', table_cell_style)],
    [Paragraph('قائمة المفضلات', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('80%', table_cell_style)],
    [Paragraph('البحث والفلترة', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('85%', table_cell_style)],
    [Paragraph('نظام التقييمات', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('90%', table_cell_style)],
    [Paragraph('الوضع الداكن', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('95%', table_cell_style)],
]

features_table = Table(features_data, colWidths=[6*cm, 4*cm, 4*cm])
features_table.setStyle(TableStyle([
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
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(features_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 1:</b> تقييم ميزات واجهة المتجر', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=9, alignment=TA_CENTER)))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>2.2 نظام الدفع:</b>', h2_style))

payment_data = [
    [Paragraph('<b>طريقة الدفع</b>', table_header_style), Paragraph('<b>الحالة</b>', table_header_style), Paragraph('<b>الملاحظات</b>', table_header_style)],
    [Paragraph('الدفع بالبطاقة', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('Visa/Mastercard', table_cell_style)],
    [Paragraph('المحافظ الإلكترونية', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('Vodafone Cash etc.', table_cell_style)],
    [Paragraph('الدفع عبر الفوري', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('Kiosk Payment', table_cell_style)],
    [Paragraph('الدفع عند الاستلام', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('COD', table_cell_style)],
]

payment_table = Table(payment_data, colWidths=[5*cm, 4*cm, 5*cm])
payment_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(payment_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 2:</b> طرق الدفع المتاحة', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=9, alignment=TA_CENTER)))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>2.3 لوحة التحكم:</b>', h2_style))

admin_data = [
    [Paragraph('<b>الميزة</b>', table_header_style), Paragraph('<b>الحالة</b>', table_header_style), Paragraph('<b>الجودة</b>', table_header_style)],
    [Paragraph('إدارة المنتجات', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('95%', table_cell_style)],
    [Paragraph('إدارة الفئات', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('90%', table_cell_style)],
    [Paragraph('إدارة الطلبات', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('90%', table_cell_style)],
    [Paragraph('إدارة العملاء', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('85%', table_cell_style)],
    [Paragraph('التقارير', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('80%', table_cell_style)],
    [Paragraph('نظام الأدوار', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('95%', table_cell_style)],
    [Paragraph('استيراد/تصدير', table_cell_right_style), Paragraph('مكتمل', table_cell_style), Paragraph('90%', table_cell_style)],
]

admin_table = Table(admin_data, colWidths=[6*cm, 4*cm, 4*cm])
admin_table.setStyle(TableStyle([
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
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(admin_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 3:</b> تقييم ميزات لوحة التحكم', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=9, alignment=TA_CENTER)))
story.append(PageBreak())

# Section 3: Critical Gaps
story.append(Paragraph('<b>3. الفجوات الحرجة</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    'للوصول لمستوى الشركات الكبيرة، يجب معالجة الفجوات التالية:',
    body_style
))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>3.1 فجوات حرجة (عاجل):</b>', h2_style))

critical_data = [
    [Paragraph('<b>الفجوة</b>', table_header_style), Paragraph('<b>التأثير</b>', table_header_style), Paragraph('<b>الجهد</b>', table_header_style)],
    [Paragraph('حساب تكاليف الشحن', table_cell_right_style), Paragraph('تجربة مستخدم ناقصة', table_cell_style), Paragraph('3-5 أيام', table_cell_style)],
    [Paragraph('إدارة الضرائب', table_cell_right_style), Paragraph('متطلبات قانونية', table_cell_style), Paragraph('5-7 أيام', table_cell_style)],
    [Paragraph('استرداد السلات المتروكة', table_cell_right_style), Paragraph('خسارة مبيعات 15-20%', table_cell_style), Paragraph('3-5 أيام', table_cell_style)],
    [Paragraph('تخزين المفضلات في DB', table_cell_right_style), Paragraph('فقدان البيانات', table_cell_style), Paragraph('2-3 أيام', table_cell_style)],
    [Paragraph('سجل تغييرات المخزون', table_cell_right_style), Paragraph('صعوبة التتبع', table_cell_style), Paragraph('2-3 أيام', table_cell_style)],
]

critical_table = Table(critical_data, colWidths=[5.5*cm, 5*cm, 3.5*cm])
critical_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#C00000')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#FFF0F0')),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#FFF0F0')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#FFF0F0')),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#FFF0F0')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.HexColor('#FFF0F0')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(critical_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 4:</b> الفجوات الحرجة', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=9, alignment=TA_CENTER)))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>3.2 فجوات متوسطة الأهمية:</b>', h2_style))

medium_data = [
    [Paragraph('<b>الفجوة</b>', table_header_style), Paragraph('<b>التأثير</b>', table_header_style), Paragraph('<b>الجهد</b>', table_header_style)],
    [Paragraph('توصيات المنتجات الذكية', table_cell_right_style), Paragraph('زيادة المبيعات 10-15%', table_cell_style), Paragraph('1-2 أسبوع', table_cell_style)],
    [Paragraph('العروض المحدودة (Flash Sales)', table_cell_right_style), Paragraph('زيادة التفاعل', table_cell_style), Paragraph('5-7 أيام', table_cell_style)],
    [Paragraph('بطاقات الهدايا', table_cell_right_style), Paragraph('مصدر دخل إضافي', table_cell_style), Paragraph('1-2 أسبوع', table_cell_style)],
    [Paragraph('نظام النشرات البريدية', table_cell_right_style), Paragraph('تسويق فعال', table_cell_style), Paragraph('3-5 أيام', table_cell_style)],
    [Paragraph('مقارنة المنتجات', table_cell_right_style), Paragraph('تجربة مستخدم أفضل', table_cell_style), Paragraph('3-5 أيام', table_cell_style)],
    [Paragraph('دعم العملاء المباشر (Live Chat)', table_cell_right_style), Paragraph('رضا العملاء', table_cell_style), Paragraph('1-2 أسبوع', table_cell_style)],
]

medium_table = Table(medium_data, colWidths=[5.5*cm, 5*cm, 3.5*cm])
medium_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ED7D31')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#FFF5EE')),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#FFF5EE')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#FFF5EE')),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#FFF5EE')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.HexColor('#FFF5EE')),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#FFF5EE')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(medium_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 5:</b> الفجوات متوسطة الأهمية', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=9, alignment=TA_CENTER)))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>3.3 فجوات التحليل والتسويق:</b>', h2_style))

analytics_data = [
    [Paragraph('<b>الأداة</b>', table_header_style), Paragraph('<b>الغرض</b>', table_header_style), Paragraph('<b>الأولوية</b>', table_header_style)],
    [Paragraph('Google Analytics 4', table_cell_right_style), Paragraph('تتبع سلوك المستخدمين', table_cell_style), Paragraph('عالية', table_cell_style)],
    [Paragraph('Facebook Pixel', table_cell_right_style), Paragraph('تتبع التحويلات والإعلانات', table_cell_style), Paragraph('عالية', table_cell_style)],
    [Paragraph('Schema.org Markup', table_cell_right_style), Paragraph('تحسين SEO', table_cell_style), Paragraph('متوسطة', table_cell_style)],
    [Paragraph('A/B Testing', table_cell_right_style), Paragraph('تحسين معدل التحويل', table_cell_style), Paragraph('منخفضة', table_cell_style)],
    [Paragraph('خرائط الحرارة', table_cell_right_style), Paragraph('فهم سلوك المستخدم', table_cell_style), Paragraph('منخفضة', table_cell_style)],
]

analytics_table = Table(analytics_data, colWidths=[5*cm, 6*cm, 3*cm])
analytics_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7030A0')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F5F0FF')),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F0FF')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#F5F0FF')),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F0FF')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.HexColor('#F5F0FF')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(analytics_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 6:</b> أدوات التحليل والتسويق المفقودة', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=9, alignment=TA_CENTER)))
story.append(PageBreak())

# Section 4: Security Requirements
story.append(Paragraph('<b>4. متطلبات الأمان المؤسسي</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    'للبيع لشركة كبيرة، يجب استيفاء معايير أمنية صارمة. فيما يلي التحليل:',
    body_style
))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>4.1 ثغرات أمنية حرجة:</b>', h2_style))

security_data = [
    [Paragraph('<b>الثغرة</b>', table_header_style), Paragraph('<b>الخطر</b>', table_header_style), Paragraph('<b>الحل</b>', table_header_style)],
    [Paragraph('Debug Endpoints مكشوفة', table_cell_right_style), Paragraph('تسريب معلومات', table_cell_style), Paragraph('إزالة في Production', table_cell_style)],
    [Paragraph('CORS غير محدد', table_cell_right_style), Paragraph('هجمات CSRF', table_cell_style), Paragraph('تحديد CORS صريح', table_cell_style)],
    [Paragraph('CSRF Tokens مفقودة', table_cell_right_style), Paragraph('تزوير الطلبات', table_cell_style), Paragraph('إضافة CSRF Protection', table_cell_style)],
    [Paragraph('Rate Limiting In-Memory', table_cell_right_style), Paragraph('غير موزع', table_cell_style), Paragraph('استخدام Redis', table_cell_style)],
]

security_table = Table(security_data, colWidths=[4.5*cm, 4.5*cm, 5*cm])
security_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#C00000')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#FFF0F0')),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#FFF0F0')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#FFF0F0')),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#FFF0F0')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(security_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 7:</b> الثغرات الأمنية الحرجة', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=9, alignment=TA_CENTER)))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>4.2 تحسينات أمنية مطلوبة:</b>', h2_style))

story.append(Paragraph('• إضافة Content-Security-Policy Headers', bullet_style))
story.append(Paragraph('• تفعيل HTTPS إجباري', bullet_style))
story.append(Paragraph('• تشفير البيانات الحساسة في قاعدة البيانات', bullet_style))
story.append(Paragraph('• إضافة Audit Log للتغييرات الحرجة', bullet_style))
story.append(Paragraph('• تفعيل Two-Factor Authentication للمدراء', bullet_style))
story.append(Paragraph('• تحسين التحقق من رفع الملفات', bullet_style))
story.append(Spacer(1, 18))

# Section 5: Performance Improvements
story.append(Paragraph('<b>5. تحسينات الأداء</b>', h1_style))
story.append(Spacer(1, 12))

perf_data = [
    [Paragraph('<b>التحسين</b>', table_header_style), Paragraph('<b>الفائدة</b>', table_header_style), Paragraph('<b>الأولوية</b>', table_header_style)],
    [Paragraph('ISR للصفحات الثابتة', table_cell_right_style), Paragraph('تحميل أسرع 50-70%', table_cell_style), Paragraph('عالية', table_cell_style)],
    [Paragraph('تحسين الصور (Next/Image)', table_cell_right_style), Paragraph('تقليل الحجم 60%', table_cell_style), Paragraph('عالية', table_cell_style)],
    [Paragraph('Database Indexes', table_cell_right_style), Paragraph('استعلامات أسرع', table_cell_style), Paragraph('عالية', table_cell_style)],
    [Paragraph('CDN للملفات الثابتة', table_cell_right_style), Paragraph('تحميل عالمي سريع', table_cell_style), Paragraph('متوسطة', table_cell_style)],
    [Paragraph('Lazy Loading Components', table_cell_right_style), Paragraph('تحميل أولي أسرع', table_cell_style), Paragraph('متوسطة', table_cell_style)],
    [Paragraph('Bundle Analyzer', table_cell_right_style), Paragraph('تقليل حجم JS', table_cell_style), Paragraph('منخفضة', table_cell_style)],
]

perf_table = Table(perf_data, colWidths=[5*cm, 5.5*cm, 3.5*cm])
perf_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E75B6')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(perf_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 8:</b> تحسينات الأداء المطلوبة', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=9, alignment=TA_CENTER)))
story.append(PageBreak())

# Section 6: Documentation
story.append(Paragraph('<b>6. التوثيق والدعم</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    'التوثيق الجيد ضروري لبيع المشروع لشركة كبيرة. فيما يلي الوضع الحالي:',
    body_style
))
story.append(Spacer(1, 12))

doc_data = [
    [Paragraph('<b>نوع التوثيق</b>', table_header_style), Paragraph('<b>الحالة</b>', table_header_style), Paragraph('<b>الأهمية</b>', table_header_style)],
    [Paragraph('README.md', table_cell_right_style), Paragraph('مفقود', table_cell_style), Paragraph('حرج', table_cell_style)],
    [Paragraph('API Documentation', table_cell_right_style), Paragraph('مفقود', table_cell_style), Paragraph('حرج', table_cell_style)],
    [Paragraph('دليل النشر', table_cell_right_style), Paragraph('موجود جزئياً', table_cell_style), Paragraph('عالية', table_cell_style)],
    [Paragraph('دليل المطور', table_cell_right_style), Paragraph('مفقود', table_cell_style), Paragraph('عالية', table_cell_style)],
    [Paragraph('دليل المستخدم', table_cell_right_style), Paragraph('مفقود', table_cell_style), Paragraph('متوسطة', table_cell_style)],
    [Paragraph('اختبارات الوحدة', table_cell_right_style), Paragraph('موجود 80%', table_cell_style), Paragraph('عالية', table_cell_style)],
    [Paragraph('اختبارات E2E', table_cell_right_style), Paragraph('موجود', table_cell_style), Paragraph('عالية', table_cell_style)],
]

doc_table = Table(doc_data, colWidths=[5*cm, 4.5*cm, 4.5*cm])
doc_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#FFF0F0')),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#FFF0F0')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#FFF8F0')),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#FFF0F0')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.HexColor('#FFF8F0')),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F0FFF0')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.HexColor('#F0FFF0')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(doc_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 9:</b> حالة التوثيق', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=9, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

# Section 7: Action Plan
story.append(Paragraph('<b>7. خطة العمل المقترحة</b>', h1_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>المرحلة الأولى (1-2 أسبوع):</b>', h2_style))
story.append(Paragraph('• إزالة Debug Endpoints', bullet_style))
story.append(Paragraph('• إضافة Security Headers', bullet_style))
story.append(Paragraph('• إنشاء README.md', bullet_style))
story.append(Paragraph('• إضافة CSRF Protection', bullet_style))
story.append(Paragraph('• تحسين Rate Limiting', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>المرحلة الثانية (2-4 أسبوع):</b>', h2_style))
story.append(Paragraph('• حساب تكاليف الشحن', bullet_style))
story.append(Paragraph('• إدارة الضرائب', bullet_style))
story.append(Paragraph('• استرداد السلات المتروكة', bullet_style))
story.append(Paragraph('• تخزين المفضلات في DB', bullet_style))
story.append(Paragraph('• Google Analytics 4 + Facebook Pixel', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>المرحلة الثالثة (1-2 شهر):</b>', h2_style))
story.append(Paragraph('• توصيات المنتجات الذكية', bullet_style))
story.append(Paragraph('• Flash Sales', bullet_style))
story.append(Paragraph('• بطاقات الهدايا', bullet_style))
story.append(Paragraph('• نظام النشرات البريدية', bullet_style))
story.append(Paragraph('• API Documentation كامل', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph('<b>المرحلة الرابعة (2-3 شهر):</b>', h2_style))
story.append(Paragraph('• Live Chat Support', bullet_style))
story.append(Paragraph('• Multi-warehouse (اختياري)', bullet_style))
story.append(Paragraph('• Two-Factor Authentication', bullet_style))
story.append(Paragraph('• Audit Logging', bullet_style))
story.append(PageBreak())

# Section 8: Final Recommendations
story.append(Paragraph('<b>8. التوصيات النهائية</b>', h1_style))
story.append(Spacer(1, 12))

# Final Score
final_data = [
    [Paragraph('<b>المعيار</b>', table_header_style), Paragraph('<b>الحالي</b>', table_header_style), Paragraph('<b>المستهدف</b>', table_header_style)],
    [Paragraph('الميزات الأساسية', table_cell_right_style), Paragraph('95%', table_cell_style), Paragraph('98%', table_cell_style)],
    [Paragraph('جودة الكود', table_cell_right_style), Paragraph('80%', table_cell_style), Paragraph('90%', table_cell_style)],
    [Paragraph('الأمان', table_cell_right_style), Paragraph('70%', table_cell_style), Paragraph('95%', table_cell_style)],
    [Paragraph('الأداء', table_cell_right_style), Paragraph('75%', table_cell_style), Paragraph('90%', table_cell_style)],
    [Paragraph('الاختبارات', table_cell_right_style), Paragraph('80%', table_cell_style), Paragraph('90%', table_cell_style)],
    [Paragraph('التوثيق', table_cell_right_style), Paragraph('30%', table_cell_style), Paragraph('85%', table_cell_style)],
    [Paragraph('<b>المجموع</b>', ParagraphStyle(name='BoldCell', fontName='Microsoft YaHei', fontSize=10, alignment=TA_CENTER)), Paragraph('<b>72%</b>', table_cell_style), Paragraph('<b>92%</b>', table_cell_style)],
]

final_table = Table(final_data, colWidths=[5*cm, 4.5*cm, 4.5*cm])
final_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    ('BACKGROUND', (0, 6), (-1, 6), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 7), (-1, 7), colors.HexColor('#E8F4FD')),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
]))
story.append(final_table)
story.append(Spacer(1, 6))
story.append(Paragraph('<b>جدول 10:</b> ملخص التقييم والأهداف', ParagraphStyle(name='Caption', fontName='SimHei', fontSize=9, alignment=TA_CENTER)))
story.append(Spacer(1, 18))

story.append(Paragraph('<b>الخلاصة:</b>', h2_style))
story.append(Paragraph(
    'المشروع في حالة جيدة جداً من ناحية الميزات الأساسية والبنية التقنية. '
    'للوصول لمستوى البيع لشركة كبيرة، يحتاج العمل على:',
    body_style
))
story.append(Spacer(1, 8))
story.append(Paragraph('1. تحسينات أمنية حرجة (1-2 أسبوع)', bullet_style))
story.append(Paragraph('2. توثيق شامل (1 أسبوع)', bullet_style))
story.append(Paragraph('3. ميزات مفقودة رئيسية (2-4 أسبوع)', bullet_style))
story.append(Paragraph('4. تحسينات الأداء (1-2 أسبوع)', bullet_style))
story.append(Spacer(1, 12))

story.append(Paragraph(
    '<b>الوقت المتوقع للوصول لمستوى Enterprise: 2-3 أشهر</b>',
    body_style
))

# Build PDF
doc.build(story)
print(f"PDF created successfully: {output_path}")
