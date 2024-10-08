import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Typography, TextField, Button, Link, Box, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import CryptoJS from 'crypto-js';

const SignIn: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        try {
            const encryptionKey = process.env.REACT_APP_AES_ENCRYPTION_KEY || '';
            const ivKey = process.env.REACT_APP_AES_IV || '';

            const key = CryptoJS.enc.Utf8.parse(encryptionKey);
            const iv = CryptoJS.enc.Utf8.parse(ivKey);

            const encrypted = CryptoJS.AES.encrypt(password, key, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });

            const encryptedPassword = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

            await login(username, encryptedPassword);
            navigate('/'); // Navigate to home after successful login
        } catch (error) {
            console.error('Login error:', error);
            setError('Failed to sign in. Please check your credentials.');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">Sign in</Typography>
                {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>Sign In</Button>
                    <Link component={RouterLink} to="/signup" variant="body2">{"Don't have an account? Sign Up"}</Link>
                </Box>
            </Box>
        </Container>
    );
};

export default SignIn;