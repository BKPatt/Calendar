import React from 'react';
import { Paper, Box, Button, Stack, useTheme, ButtonProps } from '@mui/material';

interface Action {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: ButtonProps['variant'];
    color?: ButtonProps['color'];
}

interface QuickActionsProps {
    actions: Action[];
}

const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={3}
            sx={{
                padding: theme.spacing(2),
                marginBottom: theme.spacing(3),
                borderRadius: 0, // Remove border radius
                backgroundColor: theme.palette.background.paper,
            }}
        >
            <Box>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    justifyContent="flex-start"
                    alignItems="center"
                    flexWrap="wrap"
                >
                    {actions.map((action, idx) => (
                        <Button
                            key={idx}
                            startIcon={action.icon}
                            variant={action.variant || 'contained'}
                            color={action.color || 'inherit'}
                            onClick={action.onClick}
                            sx={{
                                minWidth: 120,
                                textTransform: 'none',
                                fontWeight: 500,
                                borderRadius: 0, // Remove border radius
                                backgroundColor: theme.palette.grey[200],
                                color: theme.palette.text.primary,
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: theme.palette.grey[300],
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            {action.label}
                        </Button>
                    ))}
                </Stack>
            </Box>
        </Paper>
    );
};

export default QuickActions;
