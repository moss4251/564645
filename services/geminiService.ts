
import { GoogleGenAI } from "@google/genai";

// Initialize the Google GenAI client using exclusively process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTeacherEncouragement = async (isSuccess: boolean, score: number) => {
  try {
    const prompt = isSuccess 
      ? `作为一个亲切的小学数学老师，给一个刚刚连续答对10道空间方位题并通关的一年级学生写一句表扬的话。要求：语气极其活泼、充满鼓励，包含一些可爱的表情。字数在30字以内。`
      : `作为一个亲切的小学数学老师，安慰一个在第${score + 1}题做错而需要重新开始的一年级学生。要求：语气温柔，告诉他没关系，深呼吸再试一次，你是最棒的。字数在30字以内。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Access .text property directly from response as it is not a method.
    return response.text || (isSuccess ? "太棒了！你真是方位小能手！" : "没关系，我们重新挑战一次吧！");
  } catch (error) {
    console.error("Gemini Error:", error);
    return isSuccess ? "恭喜你通关啦！" : "加油，再试一次！";
  }
};
