import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;

    constructor(private config: ConfigService) {
        this.genAI = new GoogleGenerativeAI(
            this.config.get<string>('GEMINI_API_KEY') || '',
        );
    }

    async chat(userMessage: string, userDocument: string): Promise<string> {
        const model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',   // fast and free tier friendly
            systemInstruction: `You are a senior assistant with more than 15 years of experience. 
                                You answer questions strictly based on the resources provided by the user. 
                                You do not use any outside knowledge. 
                                Before answering, carefully think through the provided resource step by step internally, 
                                then give a clear and precise final answer. 
                                If the provided resource does not contain enough information to answer the question, 
                                say exactly this: "I don't have enough information in the provided resource to answer that."`,
            generationConfig: {
                temperature: 0.2,
            },
        });

        const prompt = `Here is the document content:
                        ${userDocument}
                        Question: ${userMessage}`;
        const result = await model.generateContent(prompt);
        return result.response.text();
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const embeddingModel = this.genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
        const result = await embeddingModel.embedContent(text);
        const values = result.embedding.values;
        console.log('Embedding dimensions:', values.length);
        return values;
    }
}