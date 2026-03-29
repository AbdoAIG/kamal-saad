import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import fs from 'fs';

const execAsync = promisify(exec);

// GET - Export products to Excel (.xlsx) format
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Only admins can export products
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeVariants = searchParams.get('variants') === 'true';

    // Fetch all products with their details
    const products = await db.product.findMany({
      include: {
        category: {
          select: { id: true, name: true, nameAr: true },
        },
        ...(includeVariants ? {
          variants: {
            include: {
              options: true,
            },
          },
          variantSKUs: {
            include: {
              values: {
                include: {
                  variant: true,
                  option: true,
                },
              },
            },
          },
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Prepare data for Excel
    const excelData = products.map(product => ({
      id: product.id,
      name: product.name,
      nameAr: product.nameAr,
      description: product.description || '',
      descriptionAr: product.descriptionAr || '',
      price: product.price,
      discountPrice: product.discountPrice || '',
      stock: product.stock,
      minStock: product.minStock,
      categoryId: product.categoryId,
      categoryName: product.category?.name || '',
      categoryNameAr: product.category?.nameAr || '',
      featured: product.featured ? 'نعم' : 'لا',
      hasVariants: product.hasVariants ? 'نعم' : 'لا',
      sku: product.sku || '',
      barcode: product.barcode || '',
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      salesCount: product.salesCount,
      images: product.images || '[]',
      createdAt: product.createdAt.toISOString().split('T')[0],
    }));

    // Generate Excel file using Python
    const timestamp = Date.now();
    const inputPath = `/tmp/products-data-${timestamp}.json`;
    const outputPath = `/tmp/products-export-${timestamp}.xlsx`;

    // Write JSON data
    await writeFile(inputPath, JSON.stringify(excelData, null, 2));

    // Python script to generate Excel
    const pythonScript = `
import json
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Read data
with open('${inputPath}', 'r') as f:
    data = json.load(f)

# Create workbook
wb = Workbook()
ws = wb.active
ws.title = 'Products'

# Define styles
header_font = Font(bold=True, color='FFFFFF', size=11)
header_fill = PatternFill(start_color='1B5E20', end_color='1B5E20', fill_type='solid')
header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
cell_alignment = Alignment(horizontal='right', vertical='center', wrap_text=True)
thin_border = Border(
    left=Side(style='thin'),
    right=Side(style='thin'),
    top=Side(style='thin'),
    bottom=Side(style='thin')
)

# Headers (Arabic names)
headers = [
    'المعرف', 'الاسم (EN)', 'الاسم (AR)', 'الوصف (EN)', 'الوصف (AR)',
    'السعر', 'سعر الخصم', 'المخزون', 'حد التنبيه', 'معرف الفئة',
    'الفئة', 'الفئة (AR)', 'مميز', 'له متغيرات', 'SKU', 'الباركود',
    'التقييم', 'عدد المراجعات', 'عدد المبيعات', 'الصور', 'تاريخ الإنشاء'
]

# Write headers
for col, header in enumerate(headers, 1):
    cell = ws.cell(row=1, column=col, value=header)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = header_alignment
    cell.border = thin_border

# Write data
for row_idx, product in enumerate(data, 2):
    values = [
        product.get('id', ''),
        product.get('name', ''),
        product.get('nameAr', ''),
        product.get('description', ''),
        product.get('descriptionAr', ''),
        product.get('price', 0),
        product.get('discountPrice', ''),
        product.get('stock', 0),
        product.get('minStock', 5),
        product.get('categoryId', ''),
        product.get('categoryName', ''),
        product.get('categoryNameAr', ''),
        product.get('featured', 'لا'),
        product.get('hasVariants', 'لا'),
        product.get('sku', ''),
        product.get('barcode', ''),
        product.get('rating', 0),
        product.get('reviewsCount', 0),
        product.get('salesCount', 0),
        product.get('images', '[]'),
        product.get('createdAt', ''),
    ]
    for col, value in enumerate(values, 1):
        cell = ws.cell(row=row_idx, column=col, value=value)
        cell.alignment = cell_alignment
        cell.border = thin_border

# Auto-adjust column widths
for col in range(1, len(headers) + 1):
    max_length = 0
    column = get_column_letter(col)
    for cell in ws[column]:
        try:
            if len(str(cell.value)) > max_length:
                max_length = len(str(cell.value))
        except:
            pass
    adjusted_width = min(max_length + 2, 50)
    ws.column_dimensions[column].width = adjusted_width

# Freeze first row
ws.freeze_panes = 'A2'

# Save
wb.save('${outputPath}')
print('Success')
`;

    // Write Python script
    const scriptPath = `/tmp/generate-excel-${timestamp}.py`;
    await writeFile(scriptPath, pythonScript);

    // Execute Python script
    try {
      await execAsync(`python3 ${scriptPath}`);
    } catch (err) {
      console.error('Python script error:', err);
      // Fallback to CSV if Python fails
      return NextResponse.json(
        { success: false, error: 'Failed to generate Excel file. Please use CSV export instead.' },
        { status: 500 }
      );
    }

    // Read the generated Excel file
    const fileBuffer = fs.readFileSync(outputPath);

    // Cleanup temp files
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(scriptPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ]);

    // Return Excel file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="products-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export to Excel' },
      { status: 500 }
    );
  }
}
