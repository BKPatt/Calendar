import React, { useState } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    Paper,
    Stepper,
    Step,
    StepLabel,
    Grid2,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Snackbar,
    Alert,
    SelectChangeEvent,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    ArrowBack as BackIcon,
    ArrowForward as ForwardIcon,
    Check as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { userApi } from '../services/api/userApi';
import { UserProfile } from '../types/user';
import { useNavigate } from 'react-router-dom';

const steps = ['Basic Information', 'Contact Details', 'Preferences'];

const ProfileSetupScreen: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { updateUserProfile } = userApi;
    const { user } = useAuth();
    const navigate = useNavigate();

    const [activeStep, setActiveStep] = useState(0);
    const [profileData, setProfileData] = useState<Partial<UserProfile>>({
        firstName: '',
        lastName: '',
        profilePicture: '',
        phoneNumber: '',
        email: '',
        defaultTimezone: '',
        bio: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({ ...prev, [name as string]: value }));
    };

    const handleSelectChange = (event: SelectChangeEvent<string>) => {
        const { name, value } = event.target;
        setProfileData((prev) => ({ ...prev, [name as string]: value }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Here you would typically upload the file to your server or cloud storage
            // and get back a URL. For this example, we'll just use a fake URL.
            setProfileData((prev) => ({ ...prev, profilePicture: URL.createObjectURL(file) }));
        }
    };

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleSubmit = async () => {
        if (!user) {
            setError('User not authenticated');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const updatedProfile = await updateUserProfile(user.id, {
                ...profileData,
                notificationPreferences: {
                    email: true,
                    push: true,
                    inApp: true,
                },
                profileComplete: true,
            });
            navigate('/');
        } catch (err) {
            setError('Failed to update profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return (
                    <Grid2 container spacing={2}>
                        <Grid2 size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Avatar
                                src={profileData.profilePicture}
                                sx={{ width: 100, height: 100, mb: 2 }}
                            >
                                {profileData.firstName?.[0] || ''}
                            </Avatar>
                        </Grid2>
                        <Grid2 size={{ xs: 12 }}>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<UploadIcon />}
                                fullWidth
                            >
                                Upload Profile Picture
                                <input type="file" hidden accept="image/*" onChange={handleFileUpload} />
                            </Button>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="First Name"
                                name="firstName"
                                value={profileData.firstName}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="lastName"
                                value={profileData.lastName}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid2>
                    </Grid2>
                );
            case 1:
                return (
                    <Grid2 container spacing={2}>
                        <Grid2 size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={profileData.email}
                                onChange={handleInputChange}
                                required
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phoneNumber"
                                value={profileData.phoneNumber}
                                onChange={handleInputChange}
                            />
                        </Grid2>
                    </Grid2>
                );
            case 2:
                return (
                    <Grid2 container spacing={2}>
                        <Grid2 size={{ xs: 12 }}>
                            <FormControl fullWidth>
                                <InputLabel id="timezone-label">Default Timezone</InputLabel>
                                <Select
                                    labelId="timezone-label"
                                    name="defaultTimezone"
                                    value={profileData.defaultTimezone}
                                    onChange={handleSelectChange}
                                    label="Default Timezone"
                                >
                                    <MenuItem value="UTC">UTC</MenuItem>
                                    <MenuItem value="America/New_York">Eastern Time</MenuItem>
                                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                                    <MenuItem value="America/Denver">Mountain Time</MenuItem>
                                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Bio"
                                name="bio"
                                value={profileData.bio}
                                onChange={handleInputChange}
                                multiline
                                rows={4}
                            />
                        </Grid2>
                    </Grid2>
                );
            default:
                return null;
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={3} sx={{ mt: 8, p: 4, borderRadius: 2 }}>
                <Typography component="h1" variant="h4" align="center" gutterBottom>
                    Set Up Your Profile
                </Typography>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                <Box>
                    {renderStepContent(activeStep)}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            startIcon={<BackIcon />}
                        >
                            Back
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                            endIcon={activeStep === steps.length - 1 ? <CheckIcon /> : <ForwardIcon />}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} />
                            ) : activeStep === steps.length - 1 ? (
                                'Finish'
                            ) : (
                                'Next'
                            )}
                        </Button>
                    </Box>
                </Box>
            </Paper>
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ProfileSetupScreen;