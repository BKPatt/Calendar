import { PaletteOptions } from '@mui/material/styles';

const palette = {
    primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#ffffff',
    },
    secondary: {
        main: '#9c27b0',
        light: '#ba68c8',
        dark: '#7b1fa2',
        contrastText: '#ffffff',
    },
    error: {
        main: '#d32f2f',
        light: '#ef5350',
        dark: '#c62828',
        contrastText: '#ffffff',
    },
    warning: {
        main: '#ed6c02',
        light: '#ff9800',
        dark: '#e65100',
        contrastText: '#ffffff',
    },
    info: {
        main: '#0288d1',
        light: '#03a9f4',
        dark: '#01579b',
        contrastText: '#ffffff',
    },
    success: {
        main: '#2e7d32',
        light: '#4caf50',
        dark: '#1b5e20',
        contrastText: '#ffffff',
    },
    grey: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
    },
    text: {
        primary: 'rgba(0, 0, 0, 0.87)',
        secondary: 'rgba(0, 0, 0, 0.6)',
        disabled: 'rgba(0, 0, 0, 0.38)',
    },
    background: {
        default: '#ffffff',
        paper: '#ffffff',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
};

export const lightPalette: PaletteOptions = {
    mode: 'light',
    primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
        contrastText: '#ffffff',
    },
    secondary: {
        main: '#9c27b0',
        light: '#ba68c8',
        dark: '#7b1fa2',
        contrastText: '#ffffff',
    },
    error: {
        main: '#d32f2f',
        light: '#ef5350',
        dark: '#c62828',
        contrastText: '#ffffff',
    },
    warning: {
        main: '#ed6c02',
        light: '#ff9800',
        dark: '#e65100',
        contrastText: '#ffffff',
    },
    info: {
        main: '#0288d1',
        light: '#03a9f4',
        dark: '#01579b',
        contrastText: '#ffffff',
    },
    success: {
        main: '#2e7d32',
        light: '#4caf50',
        dark: '#1b5e20',
        contrastText: '#ffffff',
    },
    grey: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#eeeeee',
        300: '#e0e0e0',
        400: '#bdbdbd',
        500: '#9e9e9e',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
    },
    text: {
        primary: 'rgba(0, 0, 0, 0.87)',
        secondary: 'rgba(0, 0, 0, 0.6)',
        disabled: 'rgba(0, 0, 0, 0.38)',
    },
    background: {
        default: '#ffffff',
        paper: '#ffffff',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
};

export const darkPalette: PaletteOptions = {
    mode: 'dark',
    primary: {
        main: '#90caf9',
        light: '#bbdefb',
        dark: '#1e88e5',
        contrastText: '#ffffff',
    },
    secondary: {
        main: '#f48fb1',
        light: '#f8bbd0',
        dark: '#c2185b',
        contrastText: '#ffffff',
    },
    background: {
        default: '#121212',
        paper: '#1e1e1e',
    },
    text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        disabled: 'rgba(255, 255, 255, 0.5)',
    },
};

// Custom colors for your app
export const customColors = {
    eventColors: [
        '#FF5252',
        '#FF4081',
        '#E040FB',
        '#7C4DFF',
        '#536DFE',
        '#448AFF',
        '#40C4FF',
        '#18FFFF',
        '#64FFDA',
        '#69F0AE',
        '#B2FF59',
        '#EEFF41',
        '#FFFF00',
        '#FFD740',
        '#FFAB40',
        '#FF6E40',
    ],
    availabilityColors: {
        available: '#4CAF50',
        busy: '#F44336',
        tentative: '#FFC107',
    },
};

export default palette;