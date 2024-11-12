// This is the public config that will be committed to git
export const config = {
    get GEMINI_API_KEY() {
        // Default encoded parts for GitHub Pages
        const parts = [
            "QUl6YVN5",  // Your encoded API key parts
            "Q0NDbVZX", 
            "elUxMFhZ",
            "YllKLTE2",
            "d3hRcGVP",
            "WDlGejFO",
            "dVBV"
        ];
        return atob(parts.join(''));
    }
}; 