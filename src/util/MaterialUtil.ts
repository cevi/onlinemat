export const generateKeywords = (text: string) => {
    text = text.toLowerCase();
    const keywords = [];
    for (let i = 1; i < text.length + 1; i++) {
        keywords.push(text.substring(0, i));
       }
    return keywords;
}