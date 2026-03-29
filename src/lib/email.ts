import { Resend } from 'resend';

interface SendWelcomeEmailParams {
  email: string;
  name: string;
}

interface SendOrderConfirmationParams {
  email: string;
  name: string;
  orderId: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
}

interface SendPasswordResetParams {
  email: string;
  name: string;
  resetToken: string;
}

interface SendOrderStatusUpdateParams {
  email: string;
  name: string;
  orderId: string;
  status: string;
  statusAr: string;
  trackingNumber?: string;
}

interface SendShippingUpdateParams {
  email: string;
  name: string;
  orderId: string;
  status: string;
  statusAr: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

interface SendEmailVerificationParams {
  email: string;
  name: string;
  verificationToken: string;
}

// Lazy initialization of Resend client
let resendClient: ReturnType<typeof Resend> | null = null;

function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Welcome email template in Arabic
function getWelcomeEmailTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مرحباً بك في كمال سعد</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      direction: rtl;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #0284c7 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .logo {
      font-size: 42px;
      font-weight: 800;
      color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
      position: relative;
      z-index: 1;
    }
    .logo span {
      color: #fbbf24;
    }
    .subtitle {
      color: rgba(255,255,255,0.9);
      font-size: 16px;
      margin-top: 10px;
      position: relative;
      z-index: 1;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 28px;
      color: #1e293b;
      margin-bottom: 20px;
      font-weight: 700;
    }
    .greeting-name {
      color: #0d9488;
    }
    .message {
      font-size: 17px;
      color: #475569;
      line-height: 1.8;
      margin-bottom: 30px;
    }
    .features {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 30px;
    }
    .feature {
      flex: 1 1 45%;
      background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #ccfbf1;
    }
    .feature-icon {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .feature-title {
      font-size: 16px;
      font-weight: 600;
      color: #0f766e;
      margin-bottom: 5px;
    }
    .feature-desc {
      font-size: 13px;
      color: #5eead4;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%);
      color: white;
      padding: 16px 40px;
      border-radius: 50px;
      text-decoration: none;
      font-size: 18px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(13, 148, 136, 0.4);
    }
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    .footer {
      background: #1e293b;
      padding: 30px;
      text-align: center;
      color: #94a3b8;
    }
    .footer-logo {
      font-size: 24px;
      font-weight: 700;
      color: white;
      margin-bottom: 15px;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin: 30px 0;
    }
    .promo-banner {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin-bottom: 30px;
      border: 2px solid #fbbf24;
    }
    .promo-title {
      font-size: 20px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 5px;
    }
    .promo-code {
      display: inline-block;
      background: #92400e;
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 600;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <div class="logo">K<span>MS</span></div>
        <div class="subtitle">كمال محمد سعد للأدوات المكتبية والمدرسية</div>
      </div>
      
      <div class="content">
        <h1 class="greeting">
          أهلاً وسهلاً <span class="greeting-name">${name}</span>! 🎉
        </h1>
        
        <p class="message">
          نشكرك على الانضمام إلى عائلة <strong>كمال سعد</strong>! نحن سعداء جداً بانضمامك إلينا، ونتمنى لك تجربة تسوق ممتعة ومميزة.
        </p>

        <div class="promo-banner">
          <div class="promo-title">🎁 خصم 10% على أول طلب!</div>
          <p style="color: #92400e; font-size: 14px; margin: 5px 0;">استخدم هذا الكود عند الشراء</p>
          <div class="promo-code">WELCOME10</div>
        </div>

        <div class="divider"></div>

        <div class="features">
          <div class="feature">
            <div class="feature-icon">🚚</div>
            <div class="feature-title">توصيل سريع</div>
            <div class="feature-desc">توصيل لباب بيتك</div>
          </div>
          <div class="feature">
            <div class="feature-icon">✅</div>
            <div class="feature-title">جودة مضمونة</div>
            <div class="feature-desc">منتجات أصلية 100%</div>
          </div>
          <div class="feature">
            <div class="feature-icon">💳</div>
            <div class="feature-title">دفع آمن</div>
            <div class="feature-desc">طرق دفع متعددة</div>
          </div>
          <div class="feature">
            <div class="feature-icon">🎧</div>
            <div class="feature-title">دعم متواصل</div>
            <div class="feature-desc">خدمة عملاء 24/7</div>
          </div>
        </div>

        <div class="cta-container">
          <a href="${process.env.NEXTAUTH_URL || 'https://kamal-saad.vercel.app'}" class="cta-button">
            تسوق الآن 🛒
          </a>
        </div>

        <div class="divider"></div>

        <p class="message" style="text-align: center; font-size: 15px;">
          إذا كان لديك أي استفسار، لا تتردد في التواصل معنا عبر:<br>
          📧 info@kamalsaad.com | 📞 01234567890
        </p>
      </div>

      <div class="footer">
        <div class="footer-logo">KMS</div>
        <p style="margin-bottom: 10px;">كمال محمد سعد للأدوات المكتبية والمدرسية</p>
        <div class="copyright">
          © ${new Date().getFullYear()} كمال سعد. جميع الحقوق محفوظة.
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Order confirmation email template
function getOrderConfirmationTemplate(name: string, orderId: string, total: number, items: { name: string; quantity: number; price: number }[]): string {
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left;">${item.price.toLocaleString()} ج.م</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد الطلب</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0d9488, #0891b2); padding: 30px; text-align: center; color: white; }
    .content { padding: 30px; }
    .order-id { background: #f0fdfa; padding: 15px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f8fafc; padding: 12px; text-align: right; }
    .total { font-size: 20px; font-weight: bold; color: #0d9488; text-align: left; padding: 15px 0; }
    .footer { background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1 style="margin: 0;">🛒 تم استلام طلبك!</h1>
        <p style="margin: 10px 0 0;">شكراً لك على ثقتك في كمال سعد</p>
      </div>
      <div class="content">
        <h2>مرحباً ${name}،</h2>
        <p>تم استلام طلبك بنجاح وسيتم تجهيزه قريباً.</p>
        
        <div class="order-id">
          <strong>رقم الطلب:</strong> #${orderId.slice(-8).toUpperCase()}
        </div>
        
        <h3>تفاصيل الطلب:</h3>
        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th style="text-align: center;">الكمية</th>
              <th style="text-align: left;">السعر</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>
        
        <div class="total">
          الإجمالي: ${total.toLocaleString()} ج.م
        </div>
        
        <p style="color: #64748b; font-size: 14px;">
          سيتم التواصل معك قريباً لتأكيد التوصيل. شكراً لتسوقك معنا!
        </p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} كمال سعد - جميع الحقوق محفوظة
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Send welcome email
export async function sendWelcomeEmail({ email, name }: SendWelcomeEmailParams) {
  try {
    const resend = getResendClient();
    
    if (!resend) {
      console.log('Resend API key not configured, skipping welcome email');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'كمال سعد <onboarding@resend.dev>',
      to: email,
      subject: '🎉 مرحباً بك في كمال سعد! أهلاً وسهلاً',
      html: getWelcomeEmailTemplate(name),
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

// Send order confirmation email
export async function sendOrderConfirmationEmail({ email, name, orderId, total, items }: SendOrderConfirmationParams) {
  try {
    const resend = getResendClient();
    
    if (!resend) {
      console.log('Resend API key not configured, skipping order confirmation email');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'كمال سعد <onboarding@resend.dev>',
      to: email,
      subject: `🛒 تأكيد الطلب #${orderId.slice(-8).toUpperCase()} - كمال سعد`,
      html: getOrderConfirmationTemplate(name, orderId, total, items),
    });

    if (error) {
      console.error('Error sending order confirmation email:', error);
      return { success: false, error };
    }

    console.log('Order confirmation email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error };
  }
}

// Password reset email template
function getPasswordResetTemplate(name: string, resetToken: string): string {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'https://kamal-saad.vercel.app'}/reset-password?token=${resetToken}`;
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة تعيين كلمة المرور</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0d9488, #0891b2); padding: 30px; text-align: center; color: white; }
    .content { padding: 30px; }
    .reset-button {
      display: inline-block;
      background: linear-gradient(135deg, #0d9488, #0891b2);
      color: white;
      padding: 16px 40px;
      border-radius: 50px;
      text-decoration: none;
      font-size: 18px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button-container { text-align: center; }
    .warning { background: #fef3c7; padding: 15px; border-radius: 10px; margin-top: 20px; }
    .footer { background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
    .code-box { background: #f0fdfa; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; font-family: monospace; font-size: 24px; color: #0d9488; letter-spacing: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1 style="margin: 0;">🔐 إعادة تعيين كلمة المرور</h1>
        <p style="margin: 10px 0 0;">كمال سعد للأدوات المكتبية</p>
      </div>
      <div class="content">
        <h2>مرحباً ${name}،</h2>
        <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
        
        <div class="button-container">
          <a href="${resetUrl}" class="reset-button">إعادة تعيين كلمة المرور</a>
        </div>
        
        <p style="text-align: center; color: #64748b;">أو انسخ هذا الرابط:</p>
        <p style="background: #f8fafc; padding: 10px; border-radius: 8px; word-break: break-all; font-size: 12px; color: #0d9488;">${resetUrl}</p>
        
        <div class="warning">
          <p style="margin: 0; color: #92400e;">⚠️ <strong>تنبيه:</strong> هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.</p>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
          إذا واجهت أي مشاكل، تواصل معنا عبر:<br>
          📧 info@kamalsaad.com | 📞 01234567890
        </p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} كمال سعد - جميع الحقوق محفوظة
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Order status update email template
function getOrderStatusUpdateTemplate(name: string, orderId: string, statusAr: string, trackingNumber?: string): string {
  const orderUrl = `${process.env.NEXTAUTH_URL || 'https://kamal-saad.vercel.app'}/orders/${orderId}`;
  
  const statusMessages: Record<string, string> = {
    pending: 'تم استلام طلبك وهو قيد المراجعة',
    confirmed: 'تم تأكيد طلبك',
    processing: 'جاري تجهيز طلبك',
    shipped: 'تم شحن طلبك وهو في الطريق إليك',
    delivered: 'تم توصيل طلبك بنجاح',
    cancelled: 'تم إلغاء طلبك',
  };
  
  const statusIcons: Record<string, string> = {
    pending: '⏳',
    confirmed: '✅',
    processing: '📦',
    shipped: '🚚',
    delivered: '🎉',
    cancelled: '❌',
  };
  
  const icon = statusIcons[statusAr] || '📦';
  const message = statusMessages[statusAr] || 'تم تحديث حالة طلبك';
  
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تحديث حالة الطلب</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0d9488, #0891b2); padding: 30px; text-align: center; color: white; }
    .content { padding: 30px; }
    .status-box { background: #f0fdfa; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
    .status-icon { font-size: 48px; margin-bottom: 10px; }
    .status-text { font-size: 20px; font-weight: bold; color: #0d9488; }
    .tracking-box { background: #fef3c7; padding: 15px; border-radius: 10px; margin: 20px 0; }
    .view-button {
      display: inline-block;
      background: linear-gradient(135deg, #0d9488, #0891b2);
      color: white;
      padding: 14px 30px;
      border-radius: 50px;
      text-decoration: none;
      font-size: 16px;
      font-weight: 600;
    }
    .button-container { text-align: center; margin: 25px 0; }
    .footer { background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1 style="margin: 0;">${icon} تحديث حالة الطلب</h1>
        <p style="margin: 10px 0 0;">كمال سعد للأدوات المكتبية</p>
      </div>
      <div class="content">
        <h2>مرحباً ${name}،</h2>
        <p>${message}</p>
        
        <div class="status-box">
          <div class="status-icon">${icon}</div>
          <div class="status-text">${statusAr}</div>
          <p style="color: #64748b; margin-top: 10px;">رقم الطلب: #${orderId.slice(-8).toUpperCase()}</p>
        </div>
        
        ${trackingNumber ? `
        <div class="tracking-box">
          <p style="margin: 0; color: #92400e;"><strong>📍 رقم التتبع:</strong> ${trackingNumber}</p>
        </div>
        ` : ''}
        
        <div class="button-container">
          <a href="${orderUrl}" class="view-button">عرض تفاصيل الطلب</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          شكراً لتسوقك معنا! 🛒
        </p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} كمال سعد - جميع الحقوق محفوظة
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Send password reset email
export async function sendPasswordResetEmail({ email, name, resetToken }: SendPasswordResetParams) {
  try {
    const resend = getResendClient();
    
    if (!resend) {
      console.log('Resend API key not configured, skipping password reset email');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'كمال سعد <onboarding@resend.dev>',
      to: email,
      subject: '🔐 إعادة تعيين كلمة المرور - كمال سعد',
      html: getPasswordResetTemplate(name, resetToken),
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error };
    }

    console.log('Password reset email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

// Send order status update email
export async function sendOrderStatusUpdateEmail({ email, name, orderId, status, statusAr, trackingNumber }: SendOrderStatusUpdateParams) {
  try {
    const resend = getResendClient();
    
    if (!resend) {
      console.log('Resend API key not configured, skipping order status email');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'كمال سعد <onboarding@resend.dev>',
      to: email,
      subject: `📦 تحديث الطلب #${orderId.slice(-8).toUpperCase()} - ${statusAr}`,
      html: getOrderStatusUpdateTemplate(name, orderId, statusAr, trackingNumber),
    });

    if (error) {
      console.error('Error sending order status email:', error);
      return { success: false, error };
    }

    console.log('Order status email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending order status email:', error);
    return { success: false, error };
  }
}

// Send shipping update email (alias for status update with shipping focus)
export async function sendShippingUpdateEmail({ email, name, orderId, status, statusAr, trackingNumber, estimatedDelivery }: SendShippingUpdateParams) {
  try {
    const resend = getResendClient();
    
    if (!resend) {
      console.log('Resend API key not configured, skipping shipping update email');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'كمال سعد <onboarding@resend.dev>',
      to: email,
      subject: `🚚 تحديث الشحن #${orderId.slice(-8).toUpperCase()} - ${statusAr}`,
      html: getOrderStatusUpdateTemplate(name, orderId, statusAr, trackingNumber),
    });

    if (error) {
      console.error('Error sending shipping update email:', error);
      return { success: false, error };
    }

    console.log('Shipping update email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending shipping update email:', error);
    return { success: false, error };
  }
}

// Email verification template
function getEmailVerificationTemplate(name: string, verificationToken: string): string {
  const verificationUrl = `${process.env.NEXTAUTH_URL || 'https://kamal-saad.vercel.app'}/verify-email?token=${verificationToken}`;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد البريد الإلكتروني</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #f4f4f4;
      margin: 0;
      padding: 20px;
      direction: rtl;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
    }
    .card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #0d9488, #0891b2);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .logo {
      font-size: 42px;
      font-weight: 800;
      color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .logo span {
      color: #fbbf24;
    }
    .content {
      padding: 40px 30px;
    }
    .verify-button {
      display: inline-block;
      background: linear-gradient(135deg, #0d9488, #0891b2);
      color: white;
      padding: 18px 50px;
      border-radius: 50px;
      text-decoration: none;
      font-size: 18px;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(13, 148, 136, 0.4);
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .warning {
      background: #fef3c7;
      padding: 20px;
      border-radius: 10px;
      margin-top: 25px;
      border-right: 4px solid #f59e0b;
    }
    .footer {
      background: #1e293b;
      padding: 25px;
      text-align: center;
      color: #94a3b8;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
      margin: 25px 0;
    }
    .icon-box {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #f0fdfa, #e0f2fe);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">K<span>MS</span></div>
        <p style="margin: 10px 0 0; opacity: 0.9;">كمال سعد للأدوات المكتبية</p>
      </div>

      <div class="content">
        <div class="icon-box">✉️</div>

        <h1 style="color: #1e293b; font-size: 26px; text-align: center; margin-bottom: 15px;">
          تأكيد البريد الإلكتروني
        </h1>

        <p style="color: #475569; font-size: 17px; text-align: center; line-height: 1.8;">
          مرحباً <strong style="color: #0d9488;">${name}</strong>،
        </p>

        <p style="color: #475569; font-size: 16px; text-align: center; line-height: 1.8;">
          شكراً لإنشاء حسابك في <strong>كمال سعد</strong>! يرجى تأكيد بريدك الإلكتروني للبدء في التسوق.
        </p>

        <div class="divider"></div>

        <div class="button-container">
          <a href="${verificationUrl}" class="verify-button">تأكيد البريد الإلكتروني</a>
        </div>

        <p style="text-align: center; color: #64748b; font-size: 14px;">
          أو انسخ هذا الرابط في المتصفح:
        </p>
        <p style="background: #f8fafc; padding: 12px; border-radius: 8px; word-break: break-all; font-size: 12px; color: #0d9488; text-align: center; border: 1px solid #e2e8f0;">
          ${verificationUrl}
        </p>

        <div class="warning">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            ⏰ <strong>تنبيه:</strong> هذا الرابط صالح لمدة 24 ساعة فقط. إذا لم تطلب إنشاء حساب، يمكنك تجاهل هذا البريد بأمان.
          </p>
        </div>

        <div class="divider"></div>

        <p style="color: #64748b; font-size: 14px; text-align: center;">
          إذا واجهت أي مشاكل، تواصل معنا عبر:<br>
          📧 info@kamalsaad.com | 📞 01234567890
        </p>
      </div>

      <div class="footer">
        <p style="margin: 0 0 10px; font-size: 16px; color: white; font-weight: 600;">KMS</p>
        <p style="margin: 0; font-size: 12px;">كمال محمد سعد للأدوات المكتبية والمدرسية</p>
        <p style="margin: 10px 0 0; font-size: 11px;">© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Send email verification
export async function sendEmailVerification({ email, name, verificationToken }: SendEmailVerificationParams) {
  try {
    const resend = getResendClient();

    if (!resend) {
      console.log('Resend API key not configured, skipping email verification');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'كمال سعد <onboarding@resend.dev>',
      to: email,
      subject: '✉️ تأكيد البريد الإلكتروني - كمال سعد',
      html: getEmailVerificationTemplate(name, verificationToken),
    });

    if (error) {
      console.error('Error sending email verification:', error);
      return { success: false, error };
    }

    console.log('Email verification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email verification:', error);
    return { success: false, error };
  }
}

// Send email verified confirmation
function getEmailVerifiedTemplate(name: string): string {
  const loginUrl = `${process.env.NEXTAUTH_URL || 'https://kamal-saad.vercel.app'}`;

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تم تأكيد البريد الإلكتروني</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      background: #f4f4f4;
      margin: 0;
      padding: 20px;
      direction: rtl;
    }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 40px 30px; text-align: center; color: white; }
    .content { padding: 40px 30px; }
    .success-icon { font-size: 64px; margin-bottom: 20px; }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #0d9488, #0891b2);
      color: white;
      padding: 16px 40px;
      border-radius: 50px;
      text-decoration: none;
      font-size: 18px;
      font-weight: 600;
    }
    .button-container { text-align: center; margin: 30px 0; }
    .footer { background: #1e293b; padding: 20px; text-align: center; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="success-icon">✅</div>
        <h1 style="margin: 0;">تم تأكيد بريدك الإلكتروني!</h1>
      </div>
      <div class="content">
        <h2 style="color: #1e293b;">مرحباً ${name}،</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.8;">
          تم تأكيد بريدك الإلكتروني بنجاح! حسابك الآن نشط ويمكنك البدء في التسوق.
        </p>
        <div class="button-container">
          <a href="${loginUrl}" class="cta-button">ابدأ التسوق الآن 🛒</a>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center;">
          شكراً لانضمامك إلى عائلة كمال سعد!
        </p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} كمال سعد - جميع الحقوق محفوظة
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendEmailVerifiedConfirmation({ email, name }: { email: string; name: string }) {
  try {
    const resend = getResendClient();

    if (!resend) {
      console.log('Resend API key not configured, skipping email verified confirmation');
      return { success: false, error: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: 'كمال سعد <onboarding@resend.dev>',
      to: email,
      subject: '✅ تم تأكيد بريدك الإلكتروني - كمال سعد',
      html: getEmailVerifiedTemplate(name),
    });

    if (error) {
      console.error('Error sending email verified confirmation:', error);
      return { success: false, error };
    }

    console.log('Email verified confirmation sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email verified confirmation:', error);
    return { success: false, error };
  }
}
