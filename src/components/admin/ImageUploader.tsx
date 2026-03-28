'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, Link, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
}

export function ImageUploader({
  images,
  onImagesChange,
  maxImages = 5,
  folder = 'kamal-saad-products',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File): Promise<{ url: string | null; error: string | null }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      console.log('Uploading file:', file.name);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Upload response:', data);

      if (!response.ok) {
        return { url: null, error: data.error || 'Upload failed' };
      }

      return { url: data.url, error: null };
    } catch (err: any) {
      console.error('Upload error:', err);
      return { url: null, error: err.message || 'Connection error' };
    }
  };

  const uploadFromUrl = async (url: string): Promise<{ url: string | null; error: string | null }> => {
    try {
      console.log('Uploading from URL:', url.substring(0, 50));

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, folder }),
      });

      const data = await response.json();
      console.log('URL upload response:', data);

      if (!response.ok) {
        return { url: null, error: data.error || 'Upload failed' };
      }

      return { url: data.url, error: null };
    } catch (err: any) {
      console.error('URL upload error:', err);
      return { url: null, error: err.message || 'Connection error' };
    }
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const validFiles = filesToUpload.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Only JPG, PNG, WebP, GIF allowed');
        return false;
      }
      if (file.size > maxSize) {
        setError('File too large. Maximum 10MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];
    let lastError: string | null = null;
    const totalFiles = validFiles.length;

    for (let i = 0; i < validFiles.length; i++) {
      const result = await uploadImage(validFiles[i]);
      if (result.url) {
        uploadedUrls.push(result.url);
      } else if (result.error) {
        lastError = result.error;
      }
      setUploadProgress(((i + 1) / totalFiles) * 100);
    }

    setIsUploading(false);
    setUploadProgress(0);

    if (uploadedUrls.length > 0) {
      onImagesChange([...images, ...uploadedUrls]);
    }

    if (uploadedUrls.length < validFiles.length && lastError) {
      setError(lastError);
    }
  }, [images, maxImages, folder, onImagesChange]);

  const handleAddExternalUrl = async () => {
    if (!externalUrl.trim()) return;

    // Validate URL
    try {
      new URL(externalUrl);
    } catch {
      setError('Invalid URL format');
      return;
    }

    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setAddingUrl(true);
    setError(null);

    // Check if it's an image URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const isImageUrl = imageExtensions.some(ext => 
      externalUrl.toLowerCase().includes(ext)
    ) || externalUrl.includes('postimg') || externalUrl.includes('imgur');

    if (isImageUrl) {
      // Upload from URL to apply watermark
      const result = await uploadFromUrl(externalUrl.trim());
      if (result.url) {
        onImagesChange([...images, result.url]);
        setExternalUrl('');
      } else {
        setError(result.error || 'Failed to upload image from URL');
      }
    } else {
      // Just add the URL as is (might not be an image)
      onImagesChange([...images, externalUrl.trim()]);
      setExternalUrl('');
    }

    setAddingUrl(false);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Reset input
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* External URL Input */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-2">
          <Link className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            إضافة صورة من رابط خارجي
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            type="url"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://i.postimg.cc/xxxxx/image.jpg"
            className="flex-1 h-10 bg-white dark:bg-gray-800"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExternalUrl())}
          />
          <Button
            type="button"
            onClick={handleAddExternalUrl}
            disabled={addingUrl || !externalUrl.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {addingUrl ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
          يدعم: postimg.cc, imgur, أو أي رابط صورة مباشر • سيتم إضافة العلامة المائية تلقائياً
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300',
          dragActive
            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-teal-400 hover:bg-gray-50 dark:hover:bg-gray-800/50',
          isUploading && 'pointer-events-none opacity-60'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-3">
            <Loader2 className="h-12 w-12 mx-auto text-teal-500 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">جاري رفع الصور...</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">{Math.round(uploadProgress)}%</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
              <Upload className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                اسحب الصور هنا أو اضغط للتحميل
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                PNG, JPG, WebP, GIF (حد أقصى 10MB لكل صورة)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <ImageIcon className="h-4 w-4 ml-2" />
              اختيار الصور
            </Button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mr-auto hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Images Preview */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              الصور المرفوعة ({images.length}/{maxImages})
            </p>
            {images.length > 1 && (
              <p className="text-xs text-gray-500">الصورة الأولى هي الرئيسية</p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {images.map((url, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-200 dark:ring-gray-700"
              >
                <img
                  src={url}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Image number badge */}
                <div className="absolute top-2 right-2 bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {index + 1}
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Main image badge */}
                {index === 0 && (
                  <div className="absolute bottom-2 right-2 left-2 bg-teal-600/90 text-white text-xs font-medium py-1 px-2 rounded-lg text-center">
                    الصورة الرئيسية
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
