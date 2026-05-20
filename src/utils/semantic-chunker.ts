export const semanticChunker = (document: string, maxWords: number = 500): { chunk_index: number, content: string, char_count: number, section_heading: string | null }[] => {

    // SPLIT INTO PARAGRAPHS
    const paragraphs = document.split('\n\n').filter((paragraph) => paragraph.trim().length > 0);

    const chunks: { chunk_index: number, content: string, char_count: number, section_heading: string | null }[] = []

    let chunk_index = 0;
    let currentHeading: string | null = null;

    for (let paragraph of paragraphs) {
        //check for currentHeading
        if (paragraph.startsWith('#')) {
            currentHeading = paragraph.slice(1).trim();
            continue;
        }

        if (paragraph.split(' ').length > maxWords) {
            const sentences = paragraph.split('. ');//sentences ends with '. ' dot and space, and next sentence starts after that space
            let newParagraph = '';

            for (let sentence of sentences) {
                if (newParagraph.split(' ').length + sentence.split(' ').length > maxWords) {
                    chunk_index++;
                    chunks.push({ chunk_index: chunk_index, content: newParagraph, char_count: newParagraph.length, section_heading: currentHeading });
                    newParagraph = sentence + '. '; // after pushing, new paragraph is empty so '.' is appended after the sentence
                }
                else {
                    newParagraph = newParagraph + sentence + '. ';
                }
            }
            if (newParagraph.trim().length > 0) {
                chunk_index++;
                chunks.push({ chunk_index: chunk_index, content: newParagraph, char_count: newParagraph.length, section_heading: currentHeading });
            }
        }
        else {
            chunk_index++;
            chunks.push({ chunk_index: chunk_index, content: paragraph, char_count: paragraph.length, section_heading: currentHeading });
        }
    }

    return chunks;
}