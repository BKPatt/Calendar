import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';
import { PaletteMode, PaletteColor } from '@mui/material';

// Import your color palettes and typography
import { lightPalette, darkPalette } from './styles/colors';
import typography from './styles/typography';

// Augment the Theme interface
declare module '@mui/material/styles' {
    interface Theme {
        status: {
            danger: string;
        };
    }
    // allow configuration using `createTheme`
    interface ThemeOptions {
        status?: {
            danger?: string;
        };
    }
}

const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
    palette: {
        mode,
        ...(mode === 'light'
            ? { ...lightPalette, primary: lightPalette.primary as PaletteColor }
            : { ...darkPalette, primary: darkPalette.primary as PaletteColor }
        ),
    },
    typography,
    shape: {
        borderRadius: 8,
    },
    status: {
        danger: '#e53e3e',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: mode === 'light'
                        ? (lightPalette.primary as PaletteColor).main || '#1976d2'
                        : (darkPalette.primary as PaletteColor).main || '#90caf9',
                },
            },
        },
    },
});

const theme = createTheme(getDesignTokens('light'));

export default theme;

// Function to toggle between light and dark modes
export const toggleTheme = (currentTheme: Theme): Theme => {
    const newPaletteMode = currentTheme.palette.mode === 'light' ? 'dark' : 'light';
    return createTheme(getDesignTokens(newPaletteMode));
};
