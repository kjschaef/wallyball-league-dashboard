import { ChatMessage } from './ChatBotCards';

/**
 * Compress and normalize a photo on the client (capped at 2048px JPEG) so
 * smartphone camera photos (often 5–12 MB) stay well under Vercel's 4.5 MB
 * serverless body limit and upload quickly. Falls back to the raw File if
 * the browser cannot decode it onto a canvas (e.g. in JSDOM tests).
 */
export async function prepareWhiteboardPhoto(
  file: File
): Promise<{ uploadFile: File; previewUrl: string }> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(reader.error || new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });

  try {
    if (
      typeof document === 'undefined' ||
      typeof Image === 'undefined' ||
      (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent))
    ) {
      return { uploadFile: file, previewUrl: rawDataUrl };
    }
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      const timeout = setTimeout(() => reject(new Error('Image decode timeout')), 500);
      el.onload = () => {
        clearTimeout(timeout);
        resolve(el);
      };
      el.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };
      el.src = rawDataUrl;
    });

    const maxDim = 2048;
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) {
      return { uploadFile: file, previewUrl: rawDataUrl };
    }

    const scale = Math.min(1, maxDim / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { uploadFile: file, previewUrl: rawDataUrl };
    }
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85)
    );
    if (!blob) {
      return { uploadFile: file, previewUrl: rawDataUrl };
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'whiteboard';
    const normalizedFile = new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
    const previewUrl = canvas.toDataURL('image/jpeg', 0.85);
    return { uploadFile: normalizedFile, previewUrl };
  } catch {
    return { uploadFile: file, previewUrl: rawDataUrl };
  }
}

export async function uploadWhiteboardPhoto(
  uploadFile: File,
  knownPlayers: Array<{ name: string }>
): Promise<any> {
  let playerNames = knownPlayers.map((p) => p.name).filter(Boolean);
  if (playerNames.length === 0) {
    try {
      const playersResponse = await fetch('/api/players');
      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        playerNames = playersData.map((player: any) => player.name).filter(Boolean);
      }
    } catch (error) {
      console.error('Failed to fetch player names for whiteboard upload:', error);
    }
  }

  const formData = new FormData();
  formData.append('image', uploadFile);
  if (playerNames.length > 0) {
    formData.append('playerNames', JSON.stringify(playerNames));
  }

  const response = await fetch('/api/chatbot/whiteboard', {
    method: 'POST',
    body: formData,
  });

  try {
    return await response.json();
  } catch {
    return {
      error: `Upload failed (${response.status})`,
      response:
        response.status === 413
          ? 'That photo is too large to upload. Please try a smaller image.'
          : 'Sorry, I encountered an error processing your whiteboard photo. Please try again.',
      type: 'error',
    };
  }
}

export async function uploadLegacyMatchImage(file: File): Promise<ChatMessage> {
  let playerNames: string[] = [];
  try {
    const playersResponse = await fetch('/api/players');
    if (playersResponse.ok) {
      const playersData = await playersResponse.json();
      playerNames = playersData.map((player: any) => player.name);
    }
  } catch (error) {
    console.error('Failed to fetch player names:', error);
  }

  const formData = new FormData();
  formData.append('image', file);
  formData.append('playerNames', JSON.stringify(playerNames));
  formData.append('step', '1');

  const response = await fetch('/api/chatbot/image', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const isUnauthorized = response.status === 401;
    const errorMsg =
      data.response ||
      (isUnauthorized
        ? 'You must be signed in as an admin to upload match result images.'
        : data.error || 'Sorry, I encountered an error processing your image. Please try again.');
    return {
      role: 'assistant',
      content: errorMsg,
      timestamp: data.timestamp || new Date().toISOString(),
      type: isUnauthorized ? 'unauthorized' : 'error',
    };
  }

  return {
    role: 'assistant',
    content: data.response || 'Image processed successfully.',
    timestamp: data.timestamp || new Date().toISOString(),
    type: data.type,
    additionalData: data.additionalData,
  };
}
