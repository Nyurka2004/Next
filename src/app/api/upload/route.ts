import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificación de seguridad: ¿Existe el Token en el servidor?
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("Falta la variable BLOB_READ_WRITE_TOKEN en Vercel");
      return NextResponse.json({ error: 'Storage token missing' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Subida real a Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    });

    // Retorna la URL de la imagen subida con éxito
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Upload error in route:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}