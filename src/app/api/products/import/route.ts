import { db } from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

interface ImportProduct {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  minStock?: number;
  categoryId: string;
  featured?: boolean;
  sku?: string;
  barcode?: string;
  images?: string[];
}

// POST - Import products from CSV/JSON data
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Only admins can import products
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const jsonData = formData.get('data') as string | null;
    const updateExisting = formData.get('updateExisting') === 'true';

    let products: ImportProduct[] = [];

    // Parse JSON data if provided
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        products = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON data' },
          { status: 400 }
        );
      }
    }
    // Parse CSV file if provided
    else if (file) {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        return NextResponse.json(
          { success: false, error: 'CSV file is empty or has no data rows' },
          { status: 400 }
        );
      }

      const headers = parseCSVLine(lines[0]);

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;

        const product: Record<string, unknown> = {};
        headers.forEach((header, index) => {
          const key = header.trim().toLowerCase().replace(/\s*\(.*?\)/g, '').replace(/\s+/g, '');
          let value: string | number | boolean = values[index]?.trim() || '';

          // Convert types
          if (['price', 'discountprice'].includes(key)) {
            value = parseFloat(value) || 0;
          } else if (['stock', 'minstock', 'reviewscount', 'salescount'].includes(key)) {
            value = parseInt(value) || 0;
          } else if (['featured', 'hasvariants'].includes(key)) {
            value = value.toLowerCase() === 'yes' || value === 'true';
          }

          product[key] = value;
        });

        // Map CSV columns to product fields
        products.push({
          name: String(product.name || product.nameen || ''),
          nameAr: String(product.namear || ''),
          description: String(product.description || product.descriptionen || ''),
          descriptionAr: String(product.descriptionar || ''),
          price: Number(product.price) || 0,
          discountPrice: product.discountprice ? Number(product.discountprice) : undefined,
          stock: Number(product.stock) || 0,
          minStock: Number(product.minstock) || 5,
          categoryId: String(product.categoryid || ''),
          featured: Boolean(product.featured),
          sku: product.sku ? String(product.sku) : undefined,
          barcode: product.barcode ? String(product.barcode) : undefined,
          images: product.images ? safeParseJSON(String(product.images)) as string[] : [],
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'No file or data provided' },
        { status: 400 }
      );
    }

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid products to import' },
        { status: 400 }
      );
    }

    // Get all categories for mapping
    const categories = await db.category.findMany({
      select: { id: true, name: true, nameAr: true },
    });

    const categoryMap = new Map<string, string>();
    categories.forEach(cat => {
      categoryMap.set(cat.id, cat.id);
      categoryMap.set(cat.name.toLowerCase(), cat.id);
      categoryMap.set(cat.nameAr, cat.id);
    });

    const results = {
      total: products.length,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each product
    for (const product of products) {
      try {
        // Validate required fields
        if (!product.name || !product.nameAr || !product.categoryId) {
          results.failed++;
          results.errors.push(`Missing required fields for product: ${product.name || 'Unknown'}`);
          continue;
        }

        // Map category ID or name to actual category ID
        let categoryId = categoryMap.get(product.categoryId) ||
          categoryMap.get(product.categoryId.toLowerCase());

        if (!categoryId) {
          results.failed++;
          results.errors.push(`Category not found for product: ${product.name}`);
          continue;
        }

        // Check if product exists (by name or SKU)
        let existingProduct: { id: string } | null = null;
        if (product.sku) {
          existingProduct = await db.product.findFirst({
            where: { sku: product.sku },
            select: { id: true },
          });
        }
        if (!existingProduct && updateExisting) {
          existingProduct = await db.product.findFirst({
            where: {
              OR: [
                { name: product.name },
                { nameAr: product.nameAr },
              ],
            },
            select: { id: true },
          });
        }

        if (existingProduct && updateExisting) {
          // Update existing product
          await db.product.update({
            where: { id: existingProduct.id },
            data: {
              name: product.name,
              nameAr: product.nameAr,
              description: product.description || '',
              descriptionAr: product.descriptionAr || '',
              price: product.price,
              discountPrice: product.discountPrice || null,
              stock: product.stock,
              minStock: product.minStock || 5,
              categoryId: categoryId,
              featured: product.featured || false,
              sku: product.sku || null,
              barcode: product.barcode || null,
              images: JSON.stringify(product.images || []),
            },
          });
          results.updated++;
        } else if (!existingProduct) {
          // Create new product
          await db.product.create({
            data: {
              name: product.name,
              nameAr: product.nameAr,
              description: product.description || '',
              descriptionAr: product.descriptionAr || '',
              price: product.price,
              discountPrice: product.discountPrice || null,
              stock: product.stock,
              minStock: product.minStock || 5,
              categoryId: categoryId,
              featured: product.featured || false,
              sku: product.sku || null,
              barcode: product.barcode || null,
              images: JSON.stringify(product.images || []),
            },
          });
          results.created++;
        } else {
          results.failed++;
          results.errors.push(`Product already exists: ${product.name} (use updateExisting=true to update)`);
        }
      } catch (err) {
        results.failed++;
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Error processing ${product.name}: ${errorMsg}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.failed} failed`,
      data: results,
    });
  } catch (error) {
    console.error('Import products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import products' },
      { status: 500 }
    );
  }
}

// Helper function to parse CSV line handling quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

// Helper function to safely parse JSON
function safeParseJSON(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}
