import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Login.css';
import { useStore } from '../Store';

const Login = React.memo(({ onClose, returnTo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch: cxtDispatch } = useStore();
  const [modalVisible, setModalVisible] = useState(false); // Local control
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
  const phoneInputRef = useRef(null);
  const otpInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const hasRedirected = useRef(false);

  useEffect(() => {
    console.log('Login useEffect triggered, checking login status');
    if (!modalVisible || hasRedirected.current) return;
    const isLoggedIn = localStorage.getItem('isLogin') === 'true' && localStorage.getItem('authToken');
    if (isLoggedIn) {
      const redirectTo = location.pathname === '/' ? '/' : (returnTo === '/payment' || location.pathname.includes('/report-display') ? '/payment' : '/');
      if (location.pathname !== redirectTo) {
        console.log('User logged in, redirecting to:', redirectTo);
        hasRedirected.current = true;
        if (onClose) onClose();
        setModalVisible(false);
        navigate(redirectTo, {
          replace: true,
          state: {
            fileKey: location.state?.fileKey || state.report?.fileKey,
            reportId: location.state?.reportId || state.report?.reportId,
          },
        });
      }
    } else {
      console.log('No user logged in, setting modal visible');
      setModalVisible(true);
    }
  }, [state.report, returnTo, location, navigate, onClose, modalVisible]);

  useEffect(() => {
    console.log('Autofocus effect triggered, modalVisible:', modalVisible, 'isLoading:', isLoading);
    const focusInput = () => {
      if (!otpSent && !showProfileForm && phoneInputRef.current && !isLoading) {
        console.log('Focusing phone input:', phoneInputRef.current);
        phoneInputRef.current.focus();
      } else if (otpSent && !showProfileForm && otpInputRef.current && !isLoading) {
        console.log('Focusing OTP input:', otpInputRef.current);
        otpInputRef.current.focus();
      } else if (showProfileForm && nameInputRef.current && !isLoading) {
        console.log('Focusing name input:', nameInputRef.current);
        nameInputRef.current.focus();
      } else {
        console.log('No input to focus, state:', { otpSent, showProfileForm, isLoading });
      }
    };
    const timer = setTimeout(focusInput, 200);
    return () => clearTimeout(timer);
  }, [otpSent, showProfileForm, modalVisible, isLoading]);

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
        const { token } = parsedBody;
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
              setError('Failed to parse profile data');
              setShowProfileForm(true);
              setIsLoading(false);
              return;
            }
          }
          if (userProfile?.name === phoneNumber || Object.keys(userProfile).length === 0) {
            console.log('New user detected, showing profile form');
            setShowProfileForm(true);
            setIsLoading(false);
            return;
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
          if (onClose) onClose();
          setModalVisible(false);
          const redirectTo = location.pathname === '/' ? '/' : (returnTo === '/payment' || location.pathname.includes('/report-display') ? '/payment' : '/');
          console.log('Redirecting to:', redirectTo);
          navigate(redirectTo, {
            replace: true,
            state: {
              fileKey: location.state?.fileKey || state.report?.fileKey,
              reportId: location.state?.reportId || state.report?.reportId,
            },
          });
        } catch (profileErr) {
          console.error('Profile fetch failed:', profileErr);
          setError('Failed to fetch profile, please complete your profile');
          setShowProfileForm(true);
          setIsLoading(false);
        }
      } else {
        setError(`Error: ${data.error || 'Invalid OTP'}`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('verifyOtp error:', err);
      setError(`An error occurred: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      setError('Please enter a valid name (minimum 2 characters)');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    setError('');
    const phoneNumber = `+91${phone}`;
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(
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
            name: name.trim(),
            email: email.trim(),
          }),
        }
      );
      const profileData = await response.json();
      console.log('manage-user-profile update response:', profileData);
      if (response.ok) {
        const enrichedUser = {
          isLogin: true,
          userId: phoneNumber,
          phone: phoneNumber,
          name: name.trim(),
          email: email.trim(),
          photo_url: null,
          token,
        };
        cxtDispatch({ type: 'USER_LOGIN', payload: enrichedUser });
        localStorage.setItem('authToken', token);
        localStorage.setItem('userInfo', JSON.stringify(enrichedUser));
        console.log('enrichedUser dispatched after profile update:', enrichedUser);
        if (onClose) onClose();
        setModalVisible(false);
        const redirectTo = location.pathname === '/' ? '/' : (returnTo === '/payment' || location.pathname.includes('/report-display') ? '/payment' : '/');
        console.log('Redirecting to:', redirectTo);
        navigate(redirectTo, {
          replace: true,
          state: {
            fileKey: location.state?.fileKey || state.report?.fileKey,
            reportId: location.state?.reportId || state.report?.reportId,
          },
        });
      } else {
        setError(`Error: ${profileData.error || 'Failed to save profile'}`);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (showProfileForm) {
      handleProfileSubmit(e);
    } else if (otpSent) {
      verifyOtp();
    } else {
      sendOtp();
    }
  };

  const handleChange = (setter) => (e) => setter(e.target.value);

  return (
    <div className="login-popup-container">
      <div
        className="login-popup"
        style={{ display: modalVisible ? 'block' : 'none' }}
      >
        <div className="login-title">
          <h3>
            {showProfileForm
              ? 'Complete Your Profile'
              : otpSent
              ? 'Verify OTP'
              : 'Please Enter Your Mobile Number'}
          </h3>
        </div>
        <div className="login-paragraph">
          {!otpSent && !showProfileForm && (
            <p>
              We will send you a <strong>One Time Password</strong>
            </p>
          )}
          {showProfileForm && (
            <p>Please provide your name and email to complete your profile</p>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          {!otpSent && !showProfileForm ? (
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
          ) : otpSent && !showProfileForm ? (
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
          ) : (
            <div className="profile-fields d-flex flex-column justify-content-center align-items-center gap-2 mt-3" style={{ width: '80%', margin: 'auto' }}>
              <input
                type="text"
                className="form-control text-center"
                placeholder="Enter Your Name"
                value={name}
                onChange={handleChange(setName)}
                maxLength={50}
                disabled={isLoading}
                ref={nameInputRef}
              />
              <input
                type="email"
                className="form-control text-center"
                placeholder="Enter Your Email"
                value={email}
                onChange={handleChange(setEmail)}
                maxLength={100}
                disabled={isLoading}
                ref={emailInputRef}
              />
            </div>
          )}
          <div className="text-center mt-3">
            <button
              type="submit"
              className="btn btn-primary w-50"
              disabled={isLoading}
            >
              {showProfileForm ? 'SAVE PROFILE' : otpSent ? 'VERIFY OTP' : 'SEND OTP'}
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
