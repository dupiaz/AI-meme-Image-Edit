
import React, { useState, useRef, useCallback } from 'react';
import { generateCaptions, editImage } from '../services/geminiService';
import Loader from './Loader';
import SparklesIcon from './icons/SparklesIcon';
import DownloadIcon from './icons/DownloadIcon';
import BackIcon from './icons/BackIcon';

interface MemeEditorProps {
  image: { url: string; mimeType: string };
  onReset: () => void;
}

const MemeEditor: React.FC<MemeEditorProps> = ({ image, onReset }) => {
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [captions, setCaptions] = useState<string[]>([]);
  const [editPrompt, setEditPrompt] = useState('');
  const [currentImage, setCurrentImage] = useState(image);
  
  const [isLoadingCaptions, setIsLoadingCaptions] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);

  const handleGenerateCaptions = async () => {
    setIsLoadingCaptions(true);
    setError(null);
    setCaptions([]);
    try {
      const result = await generateCaptions(currentImage.url);
      setCaptions(result);
    } catch (err) {
      setError('Could not generate captions. Please try again.');
      console.error(err);
    } finally {
      setIsLoadingCaptions(false);
    }
  };

  const handleImageEdit = async () => {
    if (!editPrompt.trim()) return;
    setIsLoadingEdit(true);
    setError(null);
    try {
      const result = await editImage(currentImage.url, currentImage.mimeType, editPrompt);
      setCurrentImage(result);
      setEditPrompt('');
      // Clear captions and text as they may no longer apply
      setCaptions([]);
      setTopText('');
      setBottomText('');
    } catch (err) {
      setError('Could not edit the image. The model might not support this request.');
      console.error(err);
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (!ctx || !img) return;

    const scale = img.naturalWidth / img.width;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const fontSize = Math.max(img.naturalWidth / 15, 20);
    ctx.font = `${fontSize}px Impact, sans-serif`;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = fontSize / 15;
    ctx.textAlign = 'center';

    const x = canvas.width / 2;
    // Fix: The 'textTransform' property does not exist on CanvasRenderingContext2D.
    // Converted text to uppercase before drawing it on the canvas.
    if (topText) {
      const topY = fontSize * 1.2;
      ctx.fillText(topText.toUpperCase(), x, topY);
      ctx.strokeText(topText.toUpperCase(), x, topY);
    }
    if (bottomText) {
      const bottomY = canvas.height - (fontSize * 0.5);
      ctx.fillText(bottomText.toUpperCase(), x, bottomY);
      ctx.strokeText(bottomText.toUpperCase(), x, bottomY);
    }

    const link = document.createElement('a');
    link.download = 'meme.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const applyCaption = useCallback((caption: string) => {
    const parts = caption.split(/[.|?|!]/);
    if (parts.length > 1 && parts[0].length > 0 && parts[1].trim().length > 0) {
      setTopText(parts[0].trim());
      setBottomText(parts.slice(1).join('.').trim());
    } else {
      setTopText(caption);
      setBottomText('');
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
      <div className="lg:w-2/3 relative">
        <button onClick={onReset} className="absolute top-2 left-2 z-10 bg-black/50 p-2 rounded-full hover:bg-black/75 transition-colors">
          <BackIcon />
        </button>
        <div className="relative bg-gray-900 border-2 border-gray-700 rounded-lg overflow-hidden">
          {(isLoadingCaptions || isLoadingEdit) && 
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
              <Loader message={isLoadingCaptions ? "Generating witty captions..." : "Applying visual magic..."} />
            </div>
          }
          <div className="relative">
            <p className="absolute top-2 w-full text-center p-2 text-3xl md:text-5xl font-extrabold break-words" style={{ fontFamily: 'Impact, sans-serif', textShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 0px 0 #000, -3px 0px 0 #000, 0px 3px 0 #000, 0px -3px 0 #000' }}>{topText}</p>
            <img ref={imageRef} src={currentImage.url} alt="Meme preview" className="w-full h-auto max-h-[70vh] object-contain"/>
            <p className="absolute bottom-2 w-full text-center p-2 text-3xl md:text-5xl font-extrabold break-words" style={{ fontFamily: 'Impact, sans-serif', textShadow: '3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 0px 0 #000, -3px 0px 0 #000, 0px 3px 0 #000, 0px -3px 0 #000' }}>{bottomText}</p>
          </div>
        </div>
      </div>
      
      <div className="lg:w-1/3 flex flex-col gap-6">
        {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md text-center">{error}</div>}
        
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-3">
            <h3 className="font-semibold text-lg text-purple-300">Meme Text</h3>
            <input type="text" value={topText} onChange={(e) => setTopText(e.target.value)} placeholder="Top Text" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"/>
            <input type="text" value={bottomText} onChange={(e) => setBottomText(e.target.value)} placeholder="Bottom Text" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"/>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-3">
          <h3 className="font-semibold text-lg text-purple-300">AI Tools</h3>
          <button onClick={handleGenerateCaptions} disabled={isLoadingCaptions || isLoadingEdit} className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed transition-colors text-white font-bold py-2 px-4 rounded-md">
            <SparklesIcon />
            Magic Caption
          </button>
          {captions.length > 0 && (
            <div className="space-y-2 pt-2">
                <h4 className="text-sm font-semibold text-gray-300">Suggestions:</h4>
                {captions.map((caption, i) => (
                    <button key={i} onClick={() => applyCaption(caption)} className="w-full text-left p-2 bg-gray-700/50 hover:bg-gray-700 rounded-md text-sm transition-colors">
                    "{caption}"
                    </button>
                ))}
            </div>
           )}
          <div className="pt-2">
            <textarea value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Or, type a prompt to edit the image... e.g., 'add a retro filter'" rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"/>
            <button onClick={handleImageEdit} disabled={isLoadingCaptions || isLoadingEdit || !editPrompt.trim()} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors text-white font-bold py-2 px-4 rounded-md">Generate Edit</button>
          </div>
        </div>

        <button onClick={handleDownload} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 transition-colors text-white font-bold py-3 px-4 rounded-md mt-auto">
          <DownloadIcon />
          Download Meme
        </button>
      </div>
    </div>
  );
};

export default MemeEditor;
