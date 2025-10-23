
import React, { useState, useCallback } from 'react';
import { TRENDING_TEMPLATES } from '../constants';
import UploadIcon from './icons/UploadIcon';
import Loader from './Loader';

interface ImageSelectorProps {
  onImageSelect: (image: { url: string; mimeType: string }) => void;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({ onImageSelect }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<{ url: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve({ url: reader.result as string, mimeType: file.type });
      reader.onerror = (err) => reject(err);
    });
  };

  const urlToDataUrl = async (url: string): Promise<{ url: string; mimeType: string }> => {
    // Using a CORS proxy for imgflip URLs
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`CORS proxy failed: ${response.statusText}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ url: reader.result as string, mimeType: blob.type });
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Failed to fetch via proxy, trying direct fetch", e);
        // Fallback to direct fetch
        const response = await fetch(url);
        const blob = await response.blob();
         return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ url: reader.result as string, mimeType: blob.type });
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
};


  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setError(null);
      try {
        const image = await fileToBase64(file);
        onImageSelect(image);
      } catch (err) {
        setError('Failed to load image file. Please try another one.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [onImageSelect]);

  const handleTemplateClick = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const image = await urlToDataUrl(url);
      onImageSelect(image);
    } catch (err) {
      setError('Failed to load template. It might be due to CORS policy. Please try uploading an image.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [onImageSelect]);

  return (
    <div className="space-y-8 animate-fade-in">
      {isLoading && <Loader message="Preparing your image..." />}
      {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md text-center">{error}</div>}

      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center">
        <h2 className="text-xl font-semibold mb-4 text-purple-300">Upload Your Image</h2>
        <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-700 transition-colors text-white font-bold py-3 px-6 rounded-lg">
          <UploadIcon />
          Choose a file
        </label>
        <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
        <p className="text-gray-400 mt-3 text-sm">PNG, JPG, or WEBP. Your image stays on your device.</p>
      </div>

      <div className="text-center">
        <div className="inline-block relative px-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative bg-gray-900 px-2 text-gray-400">OR</div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-center text-purple-300">Select a Trending Template</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {TRENDING_TEMPLATES.map((template) => (
            <div key={template.id} className="group cursor-pointer" onClick={() => handleTemplateClick(template.url)}>
              <img
                src={template.url}
                alt={template.name}
                className="w-full h-32 object-cover rounded-md border-2 border-gray-700 group-hover:border-purple-500 transition-all group-hover:scale-105"
              />
              <p className="text-center text-sm mt-2 text-gray-300 group-hover:text-white transition-colors">{template.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageSelector;
