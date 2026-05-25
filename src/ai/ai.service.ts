import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CohereClient } from 'cohere-ai';
import { ScoredChunk } from 'src/utils/types';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;
    private cohere: CohereClient;

    constructor(private config: ConfigService) {
        this.genAI = new GoogleGenerativeAI(
            this.config.get<string>('GEMINI_API_KEY') || '',
        );

        this.cohere = new CohereClient(
            { token: this.config.get<string>('COHERE_API_KEY') || '' },
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

    async generateQueries(question: string): Promise<string[]> {
        const model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: `You are a senior language scholar and a distinguished person with an experience
                                of more than 15 years.
                                You will be given a question or text and you should carefully rephrase the given
                                question into 3 other versions.
                                And its important that you only return the the 3 versions in JSON format, JSON 
                                array of strings, that's it , nothing else should be there in the response,
                                no preamble, no explanation, just the array`,
            generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json'
            },
        });

        const prompt = `Here is the question which you need to rephrase: 
                        ${question}`;
        const result = await model.generateContent(prompt);
        console.log(result.response.text());
        return JSON.parse(result.response.text());
    }

    async rerank(question: string, chunks: ScoredChunk[]): Promise<ScoredChunk[]> {

        const response = this.cohere.rerank({
            model: 'rerank-v3.5',
            query: question,
            documents: chunks.map(chunk => chunk.content),
            topN: 5
        });

        return (await response).results.map(item => chunks[item.index]);
    }

    async compressChunks(question: string, chunks: ScoredChunk[]): Promise<string[]> {
        const model = this.genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: `You are a senior chunk compressor and a distinguished person with an experience
                                of more than 15 years.
                                You will be given a question or text and an array of content which needs to compressed,
                                you should carefully extract only those sentences from each chunk or content that are relevant
                                to the question. If no sentences are relvant , return an empty string for that chunk.
                                And its important that you only return  in JSON format, JSON 
                                array of strings, that's it , nothing else should be there in the response,
                                no preamble, no explanation, just the array`,
            generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json'
            },
        });

        const prompt = `Here is the question: 
                        ${question} 
                        and here is the array of contents you need to compress
                        ${JSON.stringify(chunks.map(chunk => chunk.content))}`;

        const result = await model.generateContent(prompt);

        console.log(result.response.text());
        return JSON.parse(result.response.text());
    }
}