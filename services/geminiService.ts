
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";

const getBase64 = (dataUrl: string) => dataUrl.split(',')[1];

export const generateCaptions = async (
  imageDataUrl: string,
): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const imagePart = {
    inlineData: {
      data: getBase64(imageDataUrl),
      mimeType: 'image/jpeg', // Assuming jpeg, could be dynamic
    },
  };

  const textPart = {
    text: "You are a witty meme expert. Analyze this image and generate 5 hilarious and viral-worthy captions for it. The captions should be short and punchy. Respond with ONLY a JSON array of 5 strings."
  };
  
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            }
        }
    }
  });

  try {
    const jsonString = response.text.trim();
    const captions = JSON.parse(jsonString);
    if (Array.isArray(captions) && captions.every(c => typeof c === 'string')) {
      return captions;
    }
    throw new Error("Invalid caption format received.");
  } catch (error) {
    console.error("Error parsing captions:", error);
    throw new Error("Failed to parse captions from AI response.");
  }
};

export const editImage = async (
  imageDataUrl: string,
  mimeType: string,
  prompt: string
): Promise<{url: string; mimeType: string}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const imagePart = {
    inlineData: {
      data: getBase64(imageDataUrl),
      mimeType: mimeType,
    },
  };

  const textPart = { text: prompt };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const editedImagePart = response.candidates?.[0]?.content?.parts?.[0];

  if (editedImagePart && editedImagePart.inlineData) {
    const { data, mimeType: newMimeType } = editedImagePart.inlineData;
    return { url: `data:${newMimeType};base64,${data}`, mimeType: newMimeType };
  }
  
  throw new Error("Could not retrieve edited image from API response.");
};
