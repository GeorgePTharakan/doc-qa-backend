import { Injectable } from '@nestjs/common';
import { AiService } from 'src/ai/ai.service';
import { SupabaseService } from 'src/supabase/supabase.service';
import { chunker } from 'src/utils/chunker';
import { preprocess } from 'src/utils/preprocess';
import { semanticChunker } from 'src/utils/semantic-chunker';
const PDFParser = require('pdf2json');
@Injectable()
export class DocumentService {
    constructor(private readonly aiService: AiService,
        private readonly supabaseService: SupabaseService
    ) { }

    async ingestDocument(document: string): Promise<string> {
        // 0. preprocess
        const cleanDocument = preprocess(document);
        // 1.generate document id
        const documentId = crypto.randomUUID();

        //2. chunk the document
        // const chunks = chunker(cleanDocument).filter(chunk => chunk.trim().length > 0); //OVERLAPPING chunker
        const chunks = semanticChunker(cleanDocument).filter(chunk => chunk.content.trim().length > 0);
        //3. generate embedding and store in supabase for each chunk
        for (let chunk of chunks) {
            //4. GENERATE Embedding
            const embedding = await this.aiService.generateEmbedding(chunk.content);

            //5. STORE IN VECTORDB SUPABASE
            const result = await this.supabaseService.storeChunk(documentId, embedding, chunk);
            if (result !== 'inserted successfully') {
                throw new Error(`Failed to store chunk: ${result}`);
            }
        }

        return documentId;
    }

    //SEMANTIC/SIMILARITY SEARCH
    // async queryDocument(question: string, documentId: string): Promise<{ answer: string, sources: { content: string, similarity: number, chunk_index: number, char_count: number, section_heading: string | null }[] }> {

    //     // 1. generate embedding for the question
    //     const questionEmbedding = await this.aiService.generateEmbedding(question);

    //     // 2. similarity search in supabase for relevant chunks
    //     const similarChunks = await this.supabaseService.similaritySearch(questionEmbedding, documentId);

    //     const sources = similarChunks.map(chunk => { return { content: chunk.content, similarity: chunk.similarity, chunk_index: chunk.chunk_index, char_count: chunk.char_count, section_heading: chunk.section_heading } })

    //     // 3. combine chunks into one context string

    //     // let contextString: string = "";
    //     // for(let chunk of similarChunks){
    //     //     contextString += chunk.content + " ";
    //     // }

    //     const contextString = similarChunks.map(chunk => chunk.content).join(" ");

    //     // 4. call chat with the context and question
    //     const answer = await this.aiService.chat(question, contextString);

    //     // 5. return the answer
    //     return {
    //         answer,
    //         sources
    //     };
    // }

    //HYBRID SEARCH
    async queryDocument(question: string, documentId: string): Promise<{ answer: string, sources: { content: string, similarity: number, rank: number, finalScore: number, chunk_index: number, char_count: number, section_heading: string | null }[] }> {

        // 1. generate embedding for the question
        const questionEmbedding = await this.aiService.generateEmbedding(question);

        // 2. similarity search in supabase for relevant chunks
        const similarChunks = await this.supabaseService.similaritySearch(questionEmbedding, documentId);

        // 3. keyword search
        const similarKeywordChunks = await this.supabaseService.keywordSearch(question, documentId);

        // 4. merge both chunks using a map
        const map = new Map<number, {
            content: string;
            similarity: number;
            rank: number;
            chunk_index: number;
            char_count: number;
            section_heading: string | null;
        }>();

        for (let chunk of similarChunks) {
            map.set(chunk.id, { content: chunk.content, similarity: chunk.similarity, rank: 0, chunk_index: chunk.chunk_index, char_count: chunk.char_count, section_heading: chunk.section_heading })
        }
        for (let chunk of similarKeywordChunks) {
            if (map.has(chunk.id)) {
                const existing = map.get(chunk.id);
                if (existing) {
                    map.set(chunk.id, { ...existing, similarity: existing.similarity, rank: chunk.rank })
                }
            }
            else {
                map.set(chunk.id, { content: chunk.content, similarity: 0, rank: chunk.rank, chunk_index: chunk.chunk_index, char_count: chunk.char_count, section_heading: chunk.section_heading })
            }
        }

        let mergedChunksArray = Array.from(map.values());

        // 5. NORMALIZE SIMILARITY SCORE AND RANK 
        const minSimilarity = Math.min(...mergedChunksArray.map(chunk => chunk.similarity))
        const maxSimilarity = Math.max(...mergedChunksArray.map(chunk => chunk.similarity))
        const minRank = Math.min(...mergedChunksArray.map(chunk => chunk.rank))
        const maxRank = Math.max(...mergedChunksArray.map(chunk => chunk.rank))

        const normalizeScore = (score, metric) => {
            if (metric === 'similarity') {
                if (maxSimilarity - minSimilarity === 0) {
                    return 0;
                }
                else {
                    return (score - minSimilarity) / (maxSimilarity - minSimilarity);
                }
            }
            if (maxRank - minRank === 0) {
                return 0
            }
            else {
                return (score - minRank) / (maxRank - minRank)
            }
        }

        mergedChunksArray = mergedChunksArray.map((chunk) => { return { ...chunk, similarity: normalizeScore(chunk.similarity, 'similarity'), rank: normalizeScore(chunk.rank, 'rank') } });

        // 6. FINAL SCORE COMBINING BOTH SCORES USING WEIGHING FACTOR ALPHA, AND TAKING TOP 5 CHUNKS 
        const alpha = 0.7;


        const topChunks = mergedChunksArray.map(chunk => {
            const finalScore = (alpha * chunk.similarity) + ((1 - alpha) * chunk.rank);
            return { ...chunk, finalScore: finalScore };
        }).sort((a, b) => b.finalScore - a.finalScore).slice(0, 5);



        const sources = topChunks.map(chunk => {
            return {
                content: chunk.content,
                similarity: chunk.similarity,
                rank: chunk.rank,
                finalScore: chunk.finalScore,
                chunk_index: chunk.chunk_index,
                char_count: chunk.char_count,
                section_heading: chunk.section_heading
            }
        })

        // 7. combine chunks into one context string

        // let contextString: string = "";
        // for(let chunk of topChunks){
        //     contextString += chunk.content + " ";
        // }

        const contextString = topChunks.map(chunk => chunk.content).join(" ");

        // 8. call chat with the context and question
        const answer = await this.aiService.chat(question, contextString);

        // 9. return the answer
        return {
            answer,
            sources
        };
    }

    async ingestPdf(pdf: Buffer): Promise<string> {
        const text = await new Promise<string>((resolve, reject) => {
            const parser = new PDFParser();

            parser.on('pdfParser_dataReady', (data) => {
                const text = data.Pages
                    .flatMap(page => page.Texts)
                    .map(text => {
                        try {
                            return decodeURIComponent(text.R.map(r => r.T).join(''));
                        } catch {
                            return text.R.map(r => r.T).join('');
                        }
                    })
                    .join(' ');
                resolve(text);
            });

            parser.on('pdfParser_dataError', reject);
            parser.parseBuffer(pdf);
        });

        console.log('Extracted text length:', text.length);
        console.log('Extracted text preview:', text.substring(0, 200));

        return await this.ingestDocument(text);
    }
}
