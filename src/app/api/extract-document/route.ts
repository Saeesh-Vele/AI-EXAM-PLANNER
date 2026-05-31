import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = '';

    console.log(`[extract-document] Received file: ${file.name}, type: ${ext}, size: ${buffer.length}`);

    if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (ext === 'pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      text = data.text;
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text could be extracted from the document' }, { status: 422 });
    }

    console.log(`[extract-document] Successfully extracted ${text.length} characters`);

    return NextResponse.json({ success: true, text: text.trim() });
  } catch (error: any) {
    console.error('[extract-document] Error extracting text:', error.message);
    return NextResponse.json({ error: 'Failed to extract text from document' }, { status: 500 });
  }
}
