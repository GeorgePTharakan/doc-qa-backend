import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
@Injectable()
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor(private config: ConfigService) {
        // 1.CONNECT TO SUPABASE
        this.supabase = createClient(
            this.config.get<string>('SUPABASE_URL') || '',
            this.config.get<string>('SUPABASE_KEY') || ''
        )
    }

    //2. INSERT CHUNK TO VECTORDB
    async storeChunk(documentId: string, vectorEmbedding: number[], chunk: { chunk_index: number, content: string, char_count: number, section_heading: string | null }): Promise<string> {
        const result = await this.supabase.from('chunks').insert({
            document_id: documentId,
            content: chunk.content,
            embedding: vectorEmbedding,
            chunk_index: chunk.chunk_index,
            char_count: chunk.char_count,
            section_heading: chunk.section_heading
        });

        if (result.error) {
            return result.error.message;
        }

        return "inserted successfully";
    }

    //3. SIMILARITY SEARCH FUNCTION 
    async similaritySearch(vectorEmbedding: number[], documentId: string): Promise<{ id: number, content: string, embedding: string, similarity: number, chunk_index: number, char_count: number, section_heading: string | null }[]> {
        const result = await this.supabase.rpc('match_chunks', {
            query_embedding: vectorEmbedding,
            match_document_id: documentId,
            match_count: 50
        });

        if (result.error) throw new Error(result.error.message);
        return result.data;
    }

    async keywordSearch(queryText: string, documentId: string): Promise<{ id: number, content: string, embedding: string, rank: number, chunk_index: number, char_count: number, section_heading: string | null }[]> {
        const result = await this.supabase.rpc('keyword_search_chunks', {
            query_text: queryText,
            match_document_id: documentId,
            match_count: 50
        });

        if (result.error) throw new Error(result.error.message);
        return result.data;
    }

}
