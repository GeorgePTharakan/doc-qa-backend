export interface ScoredChunk {
    id: number,
    content: string;
    embedding: number[];
    similarity: number;
    rank: number;
    finalScore: number,
    chunk_index: number;
    char_count: number;
    section_heading: string | null;
}
