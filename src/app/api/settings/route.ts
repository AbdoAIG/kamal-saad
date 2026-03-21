import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all settings or settings by group
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');
    const key = searchParams.get('key');

    if (key) {
      const setting = await db.siteSetting?.findUnique({
        where: { key }
      });
      return NextResponse.json({ success: true, data: setting });
    }

    const where = group ? { group } : {};
    const settings = await db.siteSetting?.findMany({
      where,
      orderBy: { group: 'asc' }
    }) || [];

    const settingsObject: Record<string, string> = {};
    settings.forEach(s => {
      settingsObject[s.key] = s.value;
    });

    return NextResponse.json({ 
      success: true, 
      data: settings,
      settings: settingsObject 
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch settings' 
    }, { status: 500 });
  }
}

// POST - Create or update settings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Settings array is required' 
      }, { status: 400 });
    }

    for (const setting of settings) {
      await db.siteSetting?.upsert({
        where: { key: setting.key },
        update: { 
          value: setting.value,
          type: setting.type,
          group: setting.group,
          label: setting.label,
          labelAr: setting.labelAr,
          description: setting.description,
          descriptionAr: setting.descriptionAr
        },
        create: {
          key: setting.key,
          value: setting.value,
          type: setting.type || 'text',
          group: setting.group || 'general',
          label: setting.label || setting.key,
          labelAr: setting.labelAr,
          description: setting.description,
          descriptionAr: setting.descriptionAr
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save settings' 
    }, { status: 500 });
  }
}

// PUT - Update single setting
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ 
        success: false, 
        error: 'Setting key is required' 
      }, { status: 400 });
    }

    const setting = await db.siteSetting?.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update setting' 
    }, { status: 500 });
  }
}
