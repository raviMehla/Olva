
// 1. Chunking Engine: Breaks text into ~300 word blocks
export function chunkText(text, filename) {
    const paragraphs = text.split(/\n\s*\n/); // Split by empty lines
    const chunks = [];
    let currentChunk = "";
    
    for (const p of paragraphs) {
        if ((currentChunk.length + p.length) < 1500) { // ~300 words
            currentChunk += p + "\n\n";
        } else {
            if (currentChunk.trim()) chunks.push({ text: currentChunk.trim(), filename });
            currentChunk = p + "\n\n";
        }
    }
    if (currentChunk.trim()) chunks.push({ text: currentChunk.trim(), filename });
    return chunks;
}

// 2. Search Engine: Uses Fuse.js to find the most relevant chunks
export function searchRAG(query, sources) {
    if (!sources || sources.length === 0) return null;
    
    const fuse = new Fuse(sources, {
        keys: ['text'],
        includeScore: true,
        threshold: 0.6 // 0.0 is perfect match, 1.0 is anything. 0.6 is a good balance.
    });
    
    const results = fuse.search(query);
    
    // Take the top 3 most relevant chunks
    if (results.length === 0) return null;
    
    const top3 = results.slice(0, 3).map(r => `[Source: ${r.item.filename}]\n${r.item.text}`);
    return top3.join("\n\n---\n\n");
}