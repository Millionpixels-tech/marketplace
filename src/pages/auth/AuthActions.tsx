import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth } from "../../utils/firebase";
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { Button, Card, Input } from "../../components/UI";
import ResponsiveHeader from "../../components/UI/ResponsiveHeader";
import Footer from "../../components/UI/Footer";
import { SEOHead } from "../../components/SEO/SEOHead";
import { FiCheckCircle, FiAlertCircle, FiLock } from "react-icons/fi";

interface AuthActionState {
  mode: string | null;
  oobCode: string | null;
  continueUrl: string | null;
  email: string | null;
  loading: boolean;
  success: boolean;
  error: string;
  newPassword: string;
  confirmPassword: string;
}

const AuthActions = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [state, setState] = useState<AuthActionState>({
    mode: searchParams.get('mode'),
    oobCode: searchParams.get('oobCode'),
    continueUrl: searchParams.get('continueUrl'),
    email: null,
    loading: false,
    success: false,
    error: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (!mode || !oobCode) {
      navigate('/auth');
      return;
    }

    setState(prev => ({
      ...prev,
      mode,
      oobCode,
      continueUrl: searchParams.get('continueUrl'),
    }));

    // Handle different modes
    if (mode === 'verifyEmail') {
      handleEmailVerification(oobCode);
    } else if (mode === 'resetPassword') {
      handlePasswordResetVerification(oobCode);
    }
  }, [searchParams, navigate]);

  const handleEmailVerification = async (oobCode: string) => {
    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      await applyActionCode(auth, oobCode);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        success: true 
      }));
    } catch (error: any) {
      let errorMessage = "Email verification failed.";
      
      switch (error.code) {
        case 'auth/expired-action-code':
          errorMessage = "The verification link has expired. Please request a new one.";
          break;
        case 'auth/invalid-action-code':
          errorMessage = "The verification link is invalid or has already been used.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This user account has been disabled.";
          break;
        default:
          errorMessage = error.message || "Email verification failed.";
      }
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
    }
  };

  const handlePasswordResetVerification = async (oobCode: string) => {
    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const email = await verifyPasswordResetCode(auth, oobCode);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        email 
      }));
    } catch (error: any) {
      let errorMessage = "Password reset verification failed.";
      
      switch (error.code) {
        case 'auth/expired-action-code':
          errorMessage = "The password reset link has expired. Please request a new one.";
          break;
        case 'auth/invalid-action-code':
          errorMessage = "The password reset link is invalid or has already been used.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This user account has been disabled.";
          break;
        default:
          errorMessage = error.message || "Password reset verification failed.";
      }
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.oobCode) return;

    if (state.newPassword !== state.confirmPassword) {
      setState(prev => ({ ...prev, error: "Passwords do not match." }));
      return;
    }

    if (state.newPassword.length < 6) {
      setState(prev => ({ ...prev, error: "Password must be at least 6 characters long." }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      await confirmPasswordReset(auth, state.oobCode, state.newPassword);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        success: true 
      }));
    } catch (error: any) {
      let errorMessage = "Password reset failed.";
      
      switch (error.code) {
        case 'auth/expired-action-code':
          errorMessage = "The password reset link has expired. Please request a new one.";
          break;
        case 'auth/invalid-action-code':
          errorMessage = "The password reset link is invalid or has already been used.";
          break;
        case 'auth/weak-password':
          errorMessage = "The password is too weak. Please choose a stronger password.";
          break;
        default:
          errorMessage = error.message || "Password reset failed.";
      }
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
    }
  };

  const renderEmailVerification = () => {
    if (state.loading) {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      );
    }

    if (state.success) {
      return (
        <div className="text-center">
          <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verified!</h2>
          <p className="text-gray-600 mb-6">
            Your email has been successfully verified. You can now access all features of your account.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            style={{ backgroundColor: '#72b01d' }}
            className="w-full"
          >
            Continue to Sign In
          </Button>
        </div>
      );
    }

    if (state.error) {
      return (
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
          <p className="text-red-600 mb-6">{state.error}</p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              className="w-full"
            >
              Back to Sign In
            </Button>
            <Button
              onClick={() => navigate('/email-verification')}
              style={{ backgroundColor: '#72b01d' }}
              className="w-full"
            >
              Request New Verification Email
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderPasswordReset = () => {
    if (state.loading && !state.email) {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      );
    }

    if (state.error && !state.email) {
      return (
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Reset Link Invalid</h2>
          <p className="text-red-600 mb-6">{state.error}</p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              className="w-full"
            >
              Back to Sign In
            </Button>
            <Button
              onClick={() => navigate('/reset-password')}
              style={{ backgroundColor: '#72b01d' }}
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </div>
        </div>
      );
    }

    if (state.success) {
      return (
        <div className="text-center">
          <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            style={{ backgroundColor: '#72b01d' }}
            className="w-full"
          >
            Continue to Sign In
          </Button>
        </div>
      );
    }

    if (state.email) {
      return (
        <div>
          <div className="text-center mb-6">
            <FiLock className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
            <p className="text-gray-600">
              Enter a new password for <span className="font-medium">{state.email}</span>
            </p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-4">
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{state.error}</p>
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                value={state.newPassword}
                onChange={(e) => setState(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter your new password"
                required
                minLength={6}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={state.confirmPassword}
                onChange={(e) => setState(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your new password"
                required
                minLength={6}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              loading={state.loading}
              style={{ backgroundColor: '#72b01d' }}
              className="w-full"
            >
              Reset Password
            </Button>
          </form>
        </div>
      );
    }

    return null;
  };

  const getPageTitle = () => {
    switch (state.mode) {
      case 'verifyEmail':
        return 'Email Verification - Sina.lk';
      case 'resetPassword':
        return 'Reset Password - Sina.lk';
      default:
        return 'Authentication - Sina.lk';
    }
  };

  const getPageDescription = () => {
    switch (state.mode) {
      case 'verifyEmail':
        return 'Verify your email address to complete your Sina.lk account setup.';
      case 'resetPassword':
        return 'Reset your password to regain access to your Sina.lk account.';
      default:
        return 'Complete your authentication process on Sina.lk.';
    }
  };

  return (
    <>
      <SEOHead
        title={getPageTitle()}
        description={getPageDescription()}
        canonicalUrl="/auth-actions"
        noIndex={true}
      />
      <ResponsiveHeader />
      
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Sina.lk</h1>
            <p className="text-gray-600 mt-2">Sri Lanka's Premier Marketplace</p>
          </div>

          <Card className="py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            {state.mode === 'verifyEmail' && renderEmailVerification()}
            {state.mode === 'resetPassword' && renderPasswordReset()}
            
            {!state.mode && (
              <div className="text-center">
                <FiAlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Request</h2>
                <p className="text-gray-600 mb-6">
                  The authentication link is invalid or missing required parameters.
                </p>
                <Button
                  onClick={() => navigate('/auth')}
                  style={{ backgroundColor: '#72b01d' }}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            )}
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <a 
                href="/customer-service" 
                className="font-medium text-green-600 hover:text-green-500"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default AuthActions;
