
import React, { useState, useCallback } from 'react';
import ImageSelector from './components/ImageSelector';
import MemeEditor from './components/MemeEditor';
import Header from './components/Header';

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; mimeType: string } | null>(null);
  const [key, setKey] = useState(0); // Used to force re-mount of MemeEditor

  const handleImageSelect = useCallback((image: { url: string; mimeType: string }) => {
    setSelectedImage(image);
    setKey(prevKey => prevKey + 1); // Increment key to reset editor state
  }, []);

  const handleReset = useCallback(() => {
    setSelectedImage(null);
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {!selectedImage ? (
          <ImageSelector onImageSelect={handleImageSelect} />
        ) : (
          <MemeEditor
            key={key} // Use key to ensure fresh state when image changes
            image={selectedImage}
            onReset={handleReset}
          />
        )}
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
