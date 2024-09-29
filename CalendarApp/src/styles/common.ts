import { Theme } from '@mui/material/styles';

const createCommonStyles = (theme: Theme) => ({
    flexCenter: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    flexBetween: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    flexColumn: {
        display: 'flex',
        flexDirection: 'column',
    },
    fullWidth: {
        width: '100%',
    },
    fullHeight: {
        height: '100%',
    },
    paper: {
        padding: theme.spacing(3),
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[1],
    },
    card: {
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[2],
        transition: theme.transitions.create(['box-shadow'], {
            duration: theme.transitions.duration.short,
        }),
        '&:hover': {
            boxShadow: theme.shadows[4],
        },
    },
    button: {
        borderRadius: theme.shape.borderRadius,
        textTransform: 'none',
        fontWeight: theme.typography.fontWeightMedium,
    },
    icon: {
        marginRight: theme.spacing(1),
    },
    textEllipsis: {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    scrollbar: {
        '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
        },
        '&::-webkit-scrollbar-track': {
            backgroundColor: theme.palette.background.default,
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.grey[400],
            borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: theme.palette.grey[600],
        },
    },
});

export const commonConstants = {
    drawerWidth: 240,
    headerHeight: 64,
    footerHeight: 48,
    borderRadius: 8,
    transition: 'all 0.3s ease',
};

export default createCommonStyles;