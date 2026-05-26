import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// ==========================================
// 1. OBTENER IMÁGENES (GET)
// ==========================================
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('gallery_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET images error:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}

// ==========================================
// 2. CREAR IMAGEN (POST)
// ==========================================
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();

    if (!body.title || !body.image_url || !body.blob_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('gallery_images')
      .insert([
        {
          title: body.title,
          description: body.description || '',
          image_url: body.image_url,
          blob_url: body.blob_url,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('POST image error:', error);
    return NextResponse.json({ error: 'Failed to create image' }, { status: 500 });
  }
}

// ==========================================
// 3. ACTUALIZAR IMAGEN (PUT)
// ==========================================
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();

    if (!body.id || !body.title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: Record<string, string> = {
      title: body.title,
      description: body.description || '',
      updated_at: new Date().toISOString(),
    };

    if (body.image_url && body.blob_url) {
      updateData.image_url = body.image_url;
      updateData.blob_url = body.blob_url;
    }

    const { data, error } = await supabase
      .from('gallery_images')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('PUT image error:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}

// ==========================================
// 4. ELIMINAR IMAGEN (DELETE)
// ==========================================
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing image ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE image error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}