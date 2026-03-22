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
