import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'sales'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Kamal Saad'
    workbook.created = new Date()

    switch (type) {
      case 'sales':
        await createSalesReport(workbook, start, end)
        break
      case 'products':
        await createProductsReport(workbook, start, end)
        break
      case 'customers':
        await createCustomersReport(workbook, start, end)
        break
      case 'financial':
        await createFinancialReport(workbook, start, end)
        break
      case 'orders':
        await createOrdersReport(workbook, start, end)
        break
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${type}_report_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Error generating Excel report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

// Helper function to set RTL direction
function setupSheet(sheet: ExcelJS.Worksheet, title: string) {
  sheet.views = [{ rightToLeft: true }]
  sheet.properties.defaultRowHeight = 20
  
  // Add title
  const titleRow = sheet.addRow([title])
  titleRow.font = { size: 16, bold: true, color: { argb: 'FF1E88E5' } }
  titleRow.alignment = { horizontal: 'center' }
  sheet.mergeCells(`A1:H1`)
  
  // Add empty row
  sheet.addRow([])
  
  return sheet
}

// Sales Report Excel
async function createSalesReport(workbook: ExcelJS.Workbook, startDate: Date, endDate: Date) {
  const orders = await db.order.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    include: { user: true, items: true },
    orderBy: { createdAt: 'desc' },
  })

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('ملخص المبيعات')
  setupSheet(summarySheet, 'تقرير المبيعات')

  // Summary data
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const deliveredRevenue = deliveredOrders.reduce((s, o) => s + o.total, 0)

  const summaryData = [
    ['الفترة', `من ${startDate.toLocaleDateString('ar-EG')} إلى ${endDate.toLocaleDateString('ar-EG')}`],
    ['إجمالي الطلبات', orders.length.toString()],
    ['إجمالي الإيرادات', `${totalRevenue.toLocaleString()} ج.م`],
    ['الطلبات المسلمة', deliveredOrders.length.toString()],
    ['إيرادات الطلبات المسلمة', `${deliveredRevenue.toLocaleString()} ج.م`],
    ['متوسط قيمة الطلب', orders.length > 0 ? `${(totalRevenue / orders.length).toFixed(0)} ج.م` : '0'],
    ['الطلبات الملغاة', orders.filter(o => o.status === 'cancelled').length.toString()],
    ['الطلبات قيد الانتظار', orders.filter(o => o.status === 'pending').length.toString()],
  ]

  summaryData.forEach(row => {
    const dataRow = summarySheet.addRow(row)
    dataRow.getCell(1).font = { bold: true }
    dataRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }
  })

  // Orders Details Sheet
  const detailsSheet = workbook.addWorksheet('تفاصيل الطلبات')
  setupSheet(detailsSheet, 'تفاصيل الطلبات')

  // Headers
  const headers = ['رقم الطلب', 'العميل', 'البريد الإلكتروني', 'الإجمالي', 'الخصم', 'الطريقة', 'الحالة', 'التاريخ']
  const headerRow = detailsSheet.addRow(headers)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E88E5' } }
  headerRow.alignment = { horizontal: 'center' }

  // Data rows
  orders.forEach(order => {
    detailsSheet.addRow([
      order.id.slice(-8),
      order.user?.name || 'زائر',
      order.user?.email || '-',
      order.total,
      order.discount,
      order.paymentMethod || 'cod',
      order.status,
      order.createdAt.toLocaleDateString('ar-EG'),
    ])
  })

  // Auto-fit columns
  detailsSheet.columns.forEach(column => {
    column.width = 15
  })
}

// Products Report Excel
async function createProductsReport(workbook: ExcelJS.Workbook, startDate: Date, endDate: Date) {
  const products = await db.product.findMany({
    include: {
      category: true,
      orderItems: {
        where: { order: { createdAt: { gte: startDate, lte: endDate } } },
        include: { order: true },
      },
      reviews: true,
    },
  })

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('ملخص المنتجات')
  setupSheet(summarySheet, 'تقرير المنتجات')

  const soldQuantity = products.reduce((s, p) => s + p.orderItems.reduce((ss, i) => ss + i.quantity, 0), 0)
  const totalRevenue = products.reduce((s, p) => s + p.orderItems.reduce((ss, i) => ss + i.price * i.quantity, 0), 0)

  const summaryData = [
    ['إجمالي المنتجات', products.length.toString()],
    ['إجمالي المباع', soldQuantity.toString()],
    ['إجمالي الإيرادات', `${totalRevenue.toLocaleString()} ج.م`],
    ['منتجات مخزون منخفض (<10)', products.filter(p => p.stock < 10).length.toString()],
    ['منتجات نفذت', products.filter(p => p.stock === 0).length.toString()],
    ['منتجات مميزة', products.filter(p => p.featured).length.toString()],
  ]

  summaryData.forEach(row => {
    const dataRow = summarySheet.addRow(row)
    dataRow.getCell(1).font = { bold: true }
    dataRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }
  })

  // Products Details Sheet
  const detailsSheet = workbook.addWorksheet('تفاصيل المنتجات')
  setupSheet(detailsSheet, 'تفاصيل المنتجات')

  const headers = ['المنتج', 'الفئة', 'السعر', 'المخزون', 'المباع', 'الإيرادات', 'التقييم', 'الحالة']
  const headerRow = detailsSheet.addRow(headers)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } }

  // Sort by revenue
  const sortedProducts = products.sort((a, b) => {
    const aRevenue = a.orderItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const bRevenue = b.orderItems.reduce((s, i) => s + i.price * i.quantity, 0)
    return bRevenue - aRevenue
  })

  sortedProducts.forEach(product => {
    const sold = product.orderItems.reduce((s, i) => s + i.quantity, 0)
    const revenue = product.orderItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const avgRating = product.reviews.length > 0
      ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
      : '-'

    const row = detailsSheet.addRow([
      product.nameAr,
      product.category.nameAr,
      product.discountPrice || product.price,
      product.stock,
      sold,
      revenue,
      avgRating,
      product.stock === 0 ? 'نفذ' : product.stock < 10 ? 'منخفض' : 'متاح',
    ])

    // Color code stock status
    if (product.stock === 0) {
      row.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } }
    } else if (product.stock < 10) {
      row.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } }
    }
  })

  detailsSheet.columns.forEach(column => { column.width = 15 })
}

// Customers Report Excel
async function createCustomersReport(workbook: ExcelJS.Workbook, startDate: Date, endDate: Date) {
  const customers = await db.user.findMany({
    where: { role: 'customer' },
    include: {
      orders: {
        where: { createdAt: { gte: startDate, lte: endDate } },
      },
    },
  })

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('ملخص العملاء')
  setupSheet(summarySheet, 'تقرير العملاء')

  const activeCustomers = customers.filter(c => c.orders.length > 0)
  const newCustomers = customers.filter(c => 
    new Date(c.createdAt) >= startDate && new Date(c.createdAt) <= endDate
  )

  const summaryData = [
    ['إجمالي العملاء', customers.length.toString()],
    ['عملاء نشطين', activeCustomers.length.toString()],
    ['عملاء جدد في الفترة', newCustomers.length.toString()],
    ['عملاء عائدون', customers.filter(c => c.orders.length > 1).length.toString()],
  ]

  summaryData.forEach(row => {
    const dataRow = summarySheet.addRow(row)
    dataRow.getCell(1).font = { bold: true }
    dataRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }
  })

  // Customers Details Sheet
  const detailsSheet = workbook.addWorksheet('تفاصيل العملاء')
  setupSheet(detailsSheet, 'تفاصيل العملاء')

  const headers = ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'الطلبات', 'إجمالي المشتريات', 'تاريخ التسجيل']
  const headerRow = detailsSheet.addRow(headers)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9C27B0' } }

  // Sort by total spent
  const sortedCustomers = customers.sort((a, b) => {
    const aTotal = a.orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0)
    const bTotal = b.orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0)
    return bTotal - aTotal
  })

  sortedCustomers.forEach(customer => {
    const totalSpent = customer.orders
      .filter(o => o.status === 'delivered')
      .reduce((s, o) => s + o.total, 0)

    detailsSheet.addRow([
      customer.name || '-',
      customer.email,
      customer.phone || '-',
      customer.orders.length,
      totalSpent,
      customer.createdAt.toLocaleDateString('ar-EG'),
    ])
  })

  detailsSheet.columns.forEach(column => { column.width = 18 })
}

// Financial Report Excel
async function createFinancialReport(workbook: ExcelJS.Workbook, startDate: Date, endDate: Date) {
  const orders = await db.order.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    include: { coupon: true },
  })

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('الملخص المالي')
  setupSheet(summarySheet, 'التقرير المالي')

  const grossRevenue = orders.reduce((s, o) => s + o.total, 0)
  const deliveredRevenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0)
  const totalDiscount = orders.reduce((s, o) => s + o.discount, 0)
  const codAmount = orders.filter(o => o.paymentMethod === 'cod' && o.status === 'delivered').reduce((s, o) => s + o.total, 0)
  const onlineAmount = orders.filter(o => ['paymob', 'fawry', 'valu'].includes(o.paymentMethod || '') && o.status === 'delivered').reduce((s, o) => s + o.total, 0)

  const summaryData = [
    ['إجمالي الإيرادات (الإجمالي)', `${grossRevenue.toLocaleString()} ج.م`],
    ['إيرادات الطلبات المسلمة', `${deliveredRevenue.toLocaleString()} ج.م`],
    ['إجمالي الخصومات', `${totalDiscount.toLocaleString()} ج.م`],
    ['تحصيل COD', `${codAmount.toLocaleString()} ج.م`],
    ['مدفوعات إلكترونية', `${onlineAmount.toLocaleString()} ج.م`],
    ['إجمالي الطلبات', orders.length.toString()],
    ['الطلبات المسلمة', orders.filter(o => o.status === 'delivered').length.toString()],
    ['الطلبات الملغاة', orders.filter(o => o.status === 'cancelled').length.toString()],
  ]

  summaryData.forEach(row => {
    const dataRow = summarySheet.addRow(row)
    dataRow.getCell(1).font = { bold: true }
    dataRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } }
  })

  // Payment Methods Sheet
  const paymentSheet = workbook.addWorksheet('طرق الدفع')
  setupSheet(paymentSheet, 'توزيع طرق الدفع')

  const paymentHeaders = ['طريقة الدفع', 'عدد الطلبات', 'المبلغ']
  const paymentHeaderRow = paymentSheet.addRow(paymentHeaders)
  paymentHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  paymentHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9800' } }

  const paymentMethods = [
    { name: 'الدفع عند الاستلام', orders: orders.filter(o => o.paymentMethod === 'cod').length, amount: orders.filter(o => o.paymentMethod === 'cod').reduce((s, o) => s + o.total, 0) },
    { name: 'Paymob', orders: orders.filter(o => o.paymentMethod === 'paymob').length, amount: orders.filter(o => o.paymentMethod === 'paymob').reduce((s, o) => s + o.total, 0) },
    { name: 'Fawry', orders: orders.filter(o => o.paymentMethod === 'fawry').length, amount: orders.filter(o => o.paymentMethod === 'fawry').reduce((s, o) => s + o.total, 0) },
    { name: 'Valu', orders: orders.filter(o => o.paymentMethod === 'valu').length, amount: orders.filter(o => o.paymentMethod === 'valu').reduce((s, o) => s + o.total, 0) },
  ]

  paymentMethods.forEach(pm => {
    paymentSheet.addRow([pm.name, pm.orders, pm.amount])
  })

  paymentSheet.columns.forEach(column => { column.width = 18 })
}

// Orders Report Excel
async function createOrdersReport(workbook: ExcelJS.Workbook, startDate: Date, endDate: Date) {
  const orders = await db.order.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    include: {
      user: true,
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const ordersSheet = workbook.addWorksheet('الطلبات')
  setupSheet(ordersSheet, 'تقرير الطلبات')

  const headers = ['رقم الطلب', 'العميل', 'الهاتف', 'العنوان', 'المنتجات', 'الكمية', 'الإجمالي', 'الخصم', 'طريقة الدفع', 'الحالة', 'التاريخ']
  const headerRow = ordersSheet.addRow(headers)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2196F3' } }

  orders.forEach(order => {
    const products = order.items.map(i => i.product.nameAr).join(', ')
    const quantities = order.items.map(i => i.quantity).join(', ')
    const address = order.shippingAddress || '-'

    ordersSheet.addRow([
      order.id.slice(-8),
      order.user?.name || 'زائر',
      order.phone || '-',
      address.substring(0, 50),
      products.substring(0, 50),
      quantities,
      order.total,
      order.discount,
      order.paymentMethod || 'cod',
      order.status,
      order.createdAt.toLocaleDateString('ar-EG'),
    ])
  })

  ordersSheet.columns.forEach(column => { column.width = 15 })
}
