import { cosineSimilarity } from "./cosine-similarity";
import { ScoredChunk } from "./types";

export const mmr = (chunks: ScoredChunk[], lambda: number, maxLimit: number = 5): ScoredChunk[] => {

    let selectedList: ScoredChunk[] = [];
    let candidateList: ScoredChunk[] = [];

    const maxSimilaritytoSelectedChunks = (chunk: ScoredChunk): number => {
        return Math.max(...selectedList.map(item => cosineSimilarity(chunk.embedding, item.embedding)));
    }


    const sortedChunks = chunks.sort((a, b) => b.finalScore - a.finalScore);

    selectedList.push(sortedChunks[0]);
    candidateList = sortedChunks.slice(1);

    //LOOP TILL SELECTED LIST HAS MAX LIMIT CHUNKS IE MAXLIMIT - 1 
    for (let i = 0; i < maxLimit - 1; i++) {
        let bestChunk: ScoredChunk | null = null;
        let bestScore = -Infinity;

        for (let chunk of candidateList) {
            const score = (lambda * chunk.finalScore) - ((1 - lambda) * maxSimilaritytoSelectedChunks(chunk));

            if (score > bestScore) {
                bestScore = score;
                bestChunk = chunk;
            }
        }
        if (bestChunk) {
            selectedList.push(bestChunk);
        }

        //remove that chunk from candidate . splice removes 1 element starting from that index
        candidateList.splice(candidateList.findIndex(chunk => chunk.id === bestChunk?.id), 1);
    }

    return selectedList;
}