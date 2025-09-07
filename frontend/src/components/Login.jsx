import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';
import { useStore } from '../Store';

const Login = React.memo(({ onClose, returnTo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch: cxtDispatch } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [phone, setPhone] = useState(
    state.userInfo?.phone ? state.userInfo.phone.replace('+91', '') : ''
  );
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(false);
  const phoneInputRef = useRef(null);
  const otpInputRef = useRef(null);

  // Check if user is already logged in and redirect appropriately
  useEffect(() => {
    const isLoggedIn =
      localStorage.getItem('isLogin') === 'true' &&
      localStorage.getItem('authToken');
    if (isLoggedIn) {
      console.log(
        'User already logged in (localStorage), redirecting to:',
        location.pathname === '/' ? '/' : returnTo || '/payment'
      );
      if (onClose) onClose();
      setIsModalOpen(false);
      const redirectTo =
        location.state?.from === '/'
          ? '/'
          : returnTo === '/payment' || location.pathname.includes('/report-display')
          ? '/payment'
          : '/';
      navigate(redirectTo, {
        replace: true,
        state: {
          fileKey: location.state?.fileKey || state.report?.fileKey,
          reportId: location.state?.reportId || state.report?.reportId,
        },
      });
    } else {
      setIsModalOpen(true);
    }
  }, [state.report, returnTo, location, navigate, onClose]);

  // Autofocus input when step changes
  useEffect(() => {
    if (!otpSent && phoneInputRef.current) {
      phoneInputRef.current.focus();
    } else if (otpSent && !showProfileForm && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSent, isModalOpen, showProfileForm]);

  const sendOtp = async () => {
    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setIsLoading(true);
    setError('');
    const phoneNumber = `+91${phone}`;
    try {
      const response = await fetch(
        'https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/send-otp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        cxtDispatch({ type: 'SET_PHONE', payload: phoneNumber });
        setOtpSent(true);
      } else {
        setError(`Error: ${data.error || 'Failed to send OTP'}`);
      }
    } catch (err) {
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setIsLoading(true);
    setError('');
    const phoneNumber = `+91${phone}`;
    try {
      const response = await fetch(
        'https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/verify-otp',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneNumber, otp }),
        }
      );
      const data = await response.json();
      console.log('verify-otp response:', data);
      if (response.status === 200) {
        let parsedBody;
        try {
          parsedBody = JSON.parse(data.body);
        } catch (e) {
          console.error('Failed to parse verify-otp body:', data.body);
          setError('Authentication failed: Invalid response format');
          setIsLoading(false);
          return;
        }
        const { token, isExistingUser } = parsedBody;
        if (!token) {
          console.error('No token in parsed body:', parsedBody);
          setError('Authentication failed: No token received');
          setIsLoading(false);
          return;
        }
        const baseUser = {
          isLogin: true,
          userId: phoneNumber,
          phone: phoneNumber,
          token,
        };
        cxtDispatch({ type: 'USER_LOGIN', payload: baseUser });
        localStorage.setItem('authToken', token);
        localStorage.setItem('userInfo', JSON.stringify(baseUser));
        console.log('baseUser dispatched:', baseUser);

        if (!isExistingUser) {
          // New user → show profile form instead of redirect
          setShowProfileForm(true);
          setIsLoading(false);
          return;
        }

        // Existing user → fetch profile
        try {
          const profileRes = await fetch(
            'https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/manage-user-profile',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ action: 'get', phone_number: phoneNumber }),
            }
          );
          const profileData = await profileRes.json();
          console.log('manage-user-profile response:', profileData);
          let userProfile = profileData;
          if (profileData.body) {
            try {
              userProfile = JSON.parse(profileData.body);
            } catch (e) {
              console.error('Failed to parse profile body:', profileData.body);
            }
          }
          const enrichedUser = {
            ...baseUser,
            name: userProfile.name || 'User Name',
            email: userProfile.email || '',
            photo_url: userProfile.photo_url || null,
            token,
          };
          cxtDispatch({ type: 'USER_LOGIN', payload: enrichedUser });
          localStorage.setItem('authToken', token);
          localStorage.setItem('userInfo', JSON.stringify(enrichedUser));
          console.log('enrichedUser dispatched:', enrichedUser);
        } catch (profileErr) {
          console.error('Profile fetch failed:', profileErr);
          const fallbackUser = {
            ...baseUser,
            name: 'User Name',
            email: '',
            photo_url: null,
            token,
          };
          cxtDispatch({ type: 'USER_LOGIN', payload: fallbackUser });
          localStorage.setItem('authToken', token);
          localStorage.setItem('userInfo', JSON.stringify(fallbackUser));
          console.log('fallbackUser dispatched:', fallbackUser);
        }
        if (onClose) onClose();
        setIsModalOpen(false);
        console.log(
          'Redirect debug - returnTo:',
          returnTo,
          'location.pathname:',
          location.pathname,
          'location.state:',
          location.state
        );
        const redirectTo =
          location.state?.from === '/'
            ? '/'
            : returnTo === '/payment' || location.pathname.includes('/report-display')
            ? '/payment'
            : '/';
        console.log('Navigating to:', redirectTo);
        navigate(redirectTo, {
          replace: true,
          state: {
            fileKey: location.state?.fileKey || state.report?.fileKey,
            reportId: location.state?.reportId || state.report?.reportId,
          },
        });
      } else {
        setError(`Error: ${data.error || 'Invalid OTP'}`);
      }
    } catch (err) {
      console.error('verifyOtp error:', err);
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const submitProfile = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setEmailError(true);
      setError('Please enter a valid email');
      return;
    }
    setIsLoading(true);
    setError('');
    const phoneNumber = `+91${phone}`;
    const token = localStorage.getItem('authToken');
    try {
      const profileRes = await fetch(
        'https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/manage-user-profile',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'update',
            phone_number: phoneNumber,
            name,
            email,
          }),
        }
      );
      const profileData = await profileRes.json();
      console.log('Profile update response:', profileData);
      const enrichedUser = {
        isLogin: true,
        userId: phoneNumber,
        phone: phoneNumber,
        name,
        email,
        token,
      };
      cxtDispatch({ type: 'USER_LOGIN', payload: enrichedUser });
      localStorage.setItem('authToken', token);
      localStorage.setItem('userInfo', JSON.stringify(enrichedUser));
      console.log('newUser dispatched:', enrichedUser);
      if (onClose) onClose();
      setIsModalOpen(false);
      const redirectTo =
        location.state?.from === '/'
          ? '/'
          : returnTo === '/payment' || location.pathname.includes('/report-display')
          ? '/payment'
          : '/';
      navigate(redirectTo, {
        replace: true,
        state: {
          fileKey: location.state?.fileKey || state.report?.fileKey,
          reportId: location.state?.reportId || state.report?.reportId,
        },
      });
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!otpSent) sendOtp();
    else if (otpSent && !showProfileForm) verifyOtp();
    else if (otpSent && showProfileForm) submitProfile();
  };

  const handleChange = (setter) => (e) => setter(e.target.value);

  return (
    <div className="login-popup-container">
      <div
        className="login-popup"
        style={{ display: isModalOpen ? 'block' : 'none' }}
      >
        {!isLoading && !error && (
          <div className="login-title">
            <h3>
              {showProfileForm
                ? 'Complete Your Profile'
                : otpSent
                ? 'Verify OTP'
                : 'Please Enter Your Mobile Number'}
            </h3>
          </div>
        )}
        <div className="login-paragraph">
          {!otpSent && (
            <p>
              We will send you a <strong>One Time Password</strong>
            </p>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          {!otpSent ? (
            <div
              className="login-phone-input d-flex justify-content-center align-items-center gap-2"
              style={{ width: '80%', margin: 'auto' }}
            >
              <select
                className="form-select w-auto"
                aria-label="Country code"
                disabled
              >
                <option defaultValue>+91</option>
              </select>
              <input
                type="text"
                className="form-control text-center"
                placeholder="Enter Your 10 digit Mobile Number"
                value={phone}
                onChange={handleChange(setPhone)}
                maxLength={10}
                disabled={isLoading}
                ref={phoneInputRef}
              />
            </div>
          ) : showProfileForm ? (
            <div className="profile-form mt-3" style={{ width: '80%', margin: 'auto' }}>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={handleChange(setName)}
                className="form-control mb-2"
                disabled={isLoading}
              />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(false); // ✅ clear red border immediately
                }}
                className={`form-control mb-2 ${
                  emailError ? 'border border-danger' : ''
                }`}
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="otp-fields d-flex justify-content-center mt-3">
              <input
                type="text"
                className="form-control text-center"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={handleChange(setOtp)}
                maxLength={6}
                disabled={isLoading}
                ref={otpInputRef}
              />
            </div>
          )}
          <div className="text-center mt-3">
            <button
              type="submit"
              className="btn btn-primary w-50"
              disabled={isLoading}
            >
              {showProfileForm
                ? 'SAVE PROFILE'
                : otpSent
                ? 'VERIFY OTP'
                : 'SEND OTP'}
            </button>
          </div>
        </form>
        {error && <p className="error-message text-danger mt-2">{error}</p>}
        {isLoading && <p className="loading-message">Processing...</p>}
      </div>
    </div>
  );
});

export default Login;
