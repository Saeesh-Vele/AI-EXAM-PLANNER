// ============================================================
// ExamFlow AI — Tesseract.js OCR Service (Primary)
// Client-side OCR using Tesseract.js. Extracts raw text from
// timetable images. Text is then sent to Groq for parsing.
// ============================================================

/**
 * Progress callback for OCR status updates.
 */
export interface OCRProgress {
  stage: 'loading' | 'recognizing' | 'done' | 'error';
  progress: number; // 0-100
  message: string;
}

/**
 * Result of Tesseract OCR extraction.
 */
export interface OCRResult {
  text: string;
  confidence: number; // 0-100
  wordCount: number;
}

/**
 * Preprocesses an image via HTML5 Canvas (grayscale, contrast, threshold)
 * to improve OCR accuracy for tables and low-contrast text.
 */
async function preprocessImage(base64: string, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(`data:${mimeType};base64,${base64}`);
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Get pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply grayscale and thresholding for better contrast
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Grayscale conversion
        const v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        
        // Threshold (high contrast)
        const color = v > 128 ? 255 : 0;
        
        data[i] = color;     // R
        data[i + 1] = color; // G
        data[i + 2] = color; // B
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL(mimeType));
    };
    img.onerror = () => resolve(`data:${mimeType};base64,${base64}`); // Fallback
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

/**
 * Run Tesseract.js OCR on a base64-encoded image.
 * Returns the raw extracted text and confidence score.
 *
 * @param imageBase64 - Base64-encoded image data (without data URL prefix)
 * @param mimeType - MIME type of the image
 * @param onProgress - Optional callback for progress updates
 */
export async function extractTextFromImage(
  imageBase64: string,
  mimeType: string,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult | null> {
  try {
    // Signal: loading Tesseract engine
    onProgress?.({
      stage: 'loading',
      progress: 0,
      message: 'Loading OCR engine...',
    });

    // Dynamic import — Tesseract.js is only loaded when needed
    const Tesseract = await import('tesseract.js');

    onProgress?.({
      stage: 'loading',
      progress: 10,
      message: 'Preprocessing image for better accuracy...',
    });

    const dataUrl = await preprocessImage(imageBase64, mimeType);

    onProgress?.({
      stage: 'loading',
      progress: 15,
      message: 'OCR engine loaded. Preparing image...',
    });

    console.log('[tesseract] Starting OCR extraction...');

    // Create a worker for better configuration control
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (info: { status: string; progress: number }) => {
        if (info.status === 'recognizing text') {
          const pct = Math.round(20 + info.progress * 75); // Map 0-1 → 20-95
          onProgress?.({
            stage: 'recognizing',
            progress: pct,
            message: `Recognizing text... ${Math.round(info.progress * 100)}%`,
          });
        }
      },
    });

    // Set Page Segmentation Mode (PSM) to 6 (Assume a single uniform block of text)
    // or 4 (Assume a single column of text of variable sizes). 
    // 6 is generally good for tables/blocks where default (3) might break or miss columns.
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, // PSM 6
    });

    // Run OCR
    const result = await worker.recognize(dataUrl);
    await worker.terminate();

    const text = result.data.text;
    const confidence = result.data.confidence;
    const words = text.split(/\s+/).filter(Boolean).length;

    console.log(`[tesseract] Extracted ${text.length} chars, ${words} words, confidence: ${confidence}`);
    console.log(`[tesseract] FULL OCR TEXT:\n${text}`);

    onProgress?.({
      stage: 'done',
      progress: 100,
      message: `Extracted ${words} words (${confidence}% confidence)`,
    });

    if (text.trim().length < 10) {
      console.warn('[tesseract] Too little text extracted');
      onProgress?.({
        stage: 'error',
        progress: 100,
        message: 'Could not read enough text from the image.',
      });
      return null;
    }

    return {
      text: text.trim(),
      confidence,
      wordCount: words,
    };

  } catch (error) {
    console.error('[tesseract] OCR extraction failed:', error);
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: 'OCR engine failed to process the image.',
    });
    return null;
  }
}
