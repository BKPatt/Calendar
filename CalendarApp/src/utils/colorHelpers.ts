/**
 * Generate a random color
 * @returns hexadecimal color string
 */
export const generateRandomColor = (): string => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Determine if a color is light or dark
 * @param color - hexadecimal color string
 * @returns boolean indicating if color is light
 */
export const isLightColor = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
};

/**
 * Get contrasting text color (black or white) based on background color
 * @param backgroundColor - hexadecimal color string
 * @returns contrasting color ('black' or 'white')
 */
export const getContrastColor = (backgroundColor: string): 'black' | 'white' => {
    return isLightColor(backgroundColor) ? 'black' : 'white';
};

/**
 * Lighten or darken a color
 * @param color - hexadecimal color string
 * @param amount - amount to lighten (positive) or darken (negative)
 * @returns new hexadecimal color string
 */
export const adjustColor = (color: string, amount: number): string => {
    return '#' + color.replace(/^#/, '').replace(/../g, color =>
        ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
    );
};

/**
 * Convert a color name to its hexadecimal representation
 * @param colorName - name of the color
 * @returns hexadecimal color string
 */
export const colorNameToHex = (colorName: string): string => {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) {
        return '#000000';
    }
    ctx.fillStyle = colorName;
    return ctx.fillStyle;
};