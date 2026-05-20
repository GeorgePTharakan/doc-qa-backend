export const chunker = (document: string): string[] => {

    const words = document.split(' ');
    let chunks: string[] = []

    for (let i = 0; i < words.length; i += 400) {
        chunks.push(words.slice(i, i + 500).join(" "))
    }

    return chunks;

}