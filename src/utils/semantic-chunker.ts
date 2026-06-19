export const semanticChunker = (document: string, maxWords: number = 500): { chunk_index: number, content: string, char_count: number, section_heading: string | null }[] => {

    // SPLIT INTO PARAGRAPHS
    const paragraphs = document.split('\n\n').filter((paragraph) => paragraph.trim().length > 0);

    const chunks: { chunk_index: number, content: string, char_count: number, section_heading: string | null }[] = []

    let chunk_index = 0;
    let currentHeading: string | null = null;

    for (let paragraph of paragraphs) {
        //what if there is no /n/n between heading and paragraphs, then split by
        // /n/n will make the heading and content in one paragraph, so check each
        // line in paragraph if heading and content are split by /n then also we 
        // need to take that 
        const lines = paragraph.split('\n');
        if (lines[0].startsWith('#')) {
            currentHeading = lines[0].replace(/^#+\s+/, '');
            paragraph = lines.slice(1).join('\n');
            if (paragraph.trim().length === 0) {
                continue;
            }
        }



        // check for currentHeading
        // if (paragraph.startsWith('#')) {
        //     currentHeading = paragraph.slice(1).trim();
        //     continue;
        // }

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