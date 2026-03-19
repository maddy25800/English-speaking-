import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface IELTSFeedback {
  fluency: number;
  grammar: number;
  vocabulary: number;
  overall: number;
  transcript: string;
  feedback: string;
}

export const analyzeSpeaking = async (audioBase64: string, topic: string): Promise<IELTSFeedback> => {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    You are an expert IELTS Speaking examiner. 
    Analyze the provided audio recording for the topic: "${topic}".
    
    Tasks:
    1. Transcribe the audio accurately.
    2. Provide scores (0-9) for: Fluency and Coherence, Lexical Resource (Vocabulary), Grammatical Range and Accuracy.
    3. Calculate an overall band score.
    4. Provide detailed, actionable feedback on how to improve.
    
    Return the response in JSON format with the following structure:
    {
      "fluency": number,
      "grammar": number,
      "vocabulary": number,
      "overall": number,
      "transcript": "string",
      "feedback": "string (markdown allowed)"
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "audio/webm",
              data: audioBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const result = JSON.parse(response.text || "{}");
  return result as IELTSFeedback;
};
