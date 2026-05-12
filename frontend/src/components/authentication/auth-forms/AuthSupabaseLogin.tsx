'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { DASHBOARD_PATH } from '@/config';
import { authConfig } from '@/config/authConfig';
import { MOCK_CREDENTIALS } from '@/data/mockUsers';
import { supabase } from '@/lib/supabase';
import SocialLoginButtons from './SocialLoginButtons';

const demoCredentialOptions = [
  { label: 'Admin', role: 'Platform operations', ...MOCK_CREDENTIALS.admin },
  { label: 'Owner', role: 'Productization workspace', ...MOCK_CREDENTIALS.owner },
  { label: 'Team manager', role: 'Delivery control', ...MOCK_CREDENTIALS.team },
  { label: 'Specialist', role: 'Delivery contributor', ...MOCK_CREDENTIALS.specialist },
  { label: 'Advisor', role: 'Review and guidance', ...MOCK_CREDENTIALS.advisor },
];

const AuthSupabaseLogin = () => {
  const router = useRouter();
  const { signIn } = useSupabaseAuth();
  const shouldUseMockAuth = authConfig.shouldUseMockAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [resetMessage, setResetMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (email.length > 254) {
      newErrors.email = 'Email address is too long';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(email, password);
      router.push(DASHBOARD_PATH);
    } catch (error: any) {
      setErrors({
        general: error.message || 'Failed to sign in. Please check your credentials.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setErrors({});
    setResetMessage('');

    if (shouldUseMockAuth) {
      setResetMessage('Mock accounts use the listed development passwords.');
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Enter your email first so we can send a reset link.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;
      setResetMessage('Password reset link sent. Check your email.');
    } catch (error: any) {
      setErrors({ general: error.message || 'Unable to send password reset link.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {errors.general && (
          <Alert severity="error">{errors.general}</Alert>
        )}

        <FormControl fullWidth error={!!errors.email}>
          <InputLabel htmlFor="email-login">Email Address</InputLabel>
          <OutlinedInput
            id="email-login"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Email Address"
            inputProps={{}}
          />
          {errors.email && <FormHelperText>{errors.email}</FormHelperText>}
        </FormControl>

        <FormControl fullWidth error={!!errors.password}>
          <InputLabel htmlFor="password-login">Password</InputLabel>
          <OutlinedInput
            id="password-login"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="large"
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            }
            label="Password"
          />
          {errors.password && <FormHelperText>{errors.password}</FormHelperText>}
        </FormControl>

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                name="rememberMe"
                color="primary"
              />
            }
            label="Remember me"
          />
          <Button
            type="button"
            variant="text"
            color="secondary"
            onClick={handlePasswordReset}
            disabled={isSubmitting}
            sx={{ px: 0.5, minHeight: 34 }}
          >
            Forgot Password?
          </Button>
        </Stack>
        {resetMessage && (
          <Alert severity="success" sx={{ borderRadius: 1 }}>
            {resetMessage}
          </Alert>
        )}

        <Box>
          <Button
            disableElevation
            disabled={isSubmitting}
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            color="secondary"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </Box>

        {shouldUseMockAuth && (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              bgcolor: '#f7faff',
            }}
          >
            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Test accounts</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Local dev credentials for role-specific UI review.
            </Typography>
            <Stack spacing={1}>
              {demoCredentialOptions.map((credential) => (
                <Button
                  key={credential.email}
                  type="button"
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setEmail(credential.email);
                    setPassword(credential.password);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    minHeight: 58,
                    px: 1.5,
                    py: 1,
                    whiteSpace: 'normal',
                    textAlign: 'left',
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.25} sx={{ width: '100%', minWidth: 0 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800 }}>{credential.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflowWrap: 'anywhere' }}>
                        {credential.email} / {credential.password}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={credential.role}
                      sx={{
                        flex: '0 0 auto',
                        maxWidth: 144,
                        bgcolor: 'rgba(99, 102, 241, 0.09)',
                        color: 'secondary.main',
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        },
                      }}
                    />
                  </Stack>
                </Button>
              ))}
            </Stack>
          </Box>
        )}

        {!shouldUseMockAuth && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ textAlign: 'center', mb: 2 }}
            >
              Or continue with
            </Typography>
            <SocialLoginButtons
              onError={(error) => setErrors({ general: error })}
              onSuccess={() => router.push(DASHBOARD_PATH)}
            />
          </Box>
        )}
      </Stack>
    </form>
  );
};

export default AuthSupabaseLogin;
