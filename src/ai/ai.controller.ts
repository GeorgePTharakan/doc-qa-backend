import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { cosineSimilarity } from 'src/utils/cosine-similarity';
import { SupabaseService } from 'src/supabase/supabase.service';
import { chunker } from 'src/utils/chunker';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService,
        private readonly supabaseService: SupabaseService,
    ) { }

    @Post('chat')
    async chat(@Body() body: { message: string, document: string }): Promise<{ reply: string }> {
        const reply = await this.aiService.chat(body.message, body.document);
        return { reply };
    }

    @Post('embedding')
    async embedding(@Body() body: { text: string }): Promise<{ embedding: number[] }> {
        const embedding = await this.aiService.generateEmbedding(body.text);
        return { embedding };
    }

    @Post('similarity')
    async similarity(@Body() body: { text1: string, text2: string }): Promise<{ score: number }> {
        const embeddingA = await this.aiService.generateEmbedding(body.text1);
        const embeddingB = await this.aiService.generateEmbedding(body.text2);
        const score = cosineSimilarity(embeddingA, embeddingB);
        return { score };
    }

    // @Post('store')
    // async store(@Body() body: { documentId: string, content: string }) {
    //     const embedding = await this.aiService.generateEmbedding(body.content);
    //     const result = await this.supabaseService.storeChunk(body.documentId, embedding, body.content);
    //     return { result };
    // }

    @Post('search')
    async search(@Body() body: { documentId: string, question: string }) {
        const embedding = await this.aiService.generateEmbedding(body.question);
        const results = await this.supabaseService.similaritySearch(embedding, body.documentId);
        return { results };
    }

    @Post('chunk')
    async chunk(@Body() body: { text: string }) {
        const chunks = chunker(body.text);
        return { count: chunks.length, chunks };
    }
}