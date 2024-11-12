// More complex obfuscation
export const config = {
    get GEMINI_API_KEY() {
        const shift = 3;  // Simple shift cipher
        const encoded = [
            "encoded_part_1",  // We'll fill these with your new encoded key
            "encoded_part_2",
            "encoded_part_3",
            // ... more parts
        ];
        
        // Add some noise and decoding complexity
        return encoded
            .map(part => atob(part))
            .map(char => String.fromCharCode(...char.split('')
                .map(c => c.charCodeAt(0) - shift)))
            .join('');
    }
}; 