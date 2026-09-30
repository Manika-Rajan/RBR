import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Store } from '../Store';
import './PaymentGateway.css';
import Personal from '../assets/Personal.svg';
import Delivery from '../assets/Delivery.svg';
import pencil from '../assets/pencil.svg';
import green from '../assets/green-tick.svg';
import { getRegionConfig } from "../config/regionConfig";

const REGION = getRegionConfig();

const CONVERSION_SEND_TO = 'AW-824378442/NWTVCJbO_bobEMqIjIkD'; // Google Ads ID/Label

// ====== RBR first-party funnel tracking ======
// Reuses the same sessionStorage keys and endpoint as ReportsMobile /
// ReportsDisplayMobile so one customer journey remains linked end-to-end.
// No name, phone, email, or other PII is sent here.
const RBR_FUNNEL_TRACK_URL =
  'https://jp1bupouyl.execute-api.ap-south-1.amazonaws.com/prod/google-ads-funnel-event';

const RBR_FUNNEL_ATTR_KEYS = [
  'gclid',
  'gbraid',
  'wbraid',
  'gad_source',
  'gad_campaignid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'campaignid',
  'adgroupid',
  'keyword',
  'matchtype',
  'device',
  'network',
  'creative',
];

function getRbrFunnelSessionId() {
  if (typeof window === 'undefined') return '';

  try {
    const key = 'rbr_funnel_session_id';
    let id = sessionStorage.getItem(key);

    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `rbr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      sessionStorage.setItem(key, id);
    }

    return id;
  } catch {
    return '';
  }
}

function getRbrFunnelAttribution() {
  if (typeof window === 'undefined') return {};

  const storageKey = 'rbr_funnel_attribution';

  try {
    const existing = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
    const params = new URLSearchParams(window.location.search || '');
    const incoming = {};

    RBR_FUNNEL_ATTR_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) incoming[key] = value.slice(0, 250);
    });

    const merged = { ...existing, ...incoming };
    sessionStorage.setItem(storageKey, JSON.stringify(merged));
    return merged;
  } catch {
    return {};
  }
}

function trackExistingReportPaymentEvent({
  eventName,
  reportQuery = '',
  extra = {},
}) {
  if (!eventName || !RBR_FUNNEL_TRACK_URL) return;

  const eventId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const body = {
    event_id: eventId,
    session_id: getRbrFunnelSessionId(),
    event_name: eventName,
    event_ts: new Date().toISOString(),
    page_path:
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '',
    report_query: String(reportQuery || '').trim().slice(0, 120),
    product_type: 'existing_report',
    sample_seen: false,
    attribution: getRbrFunnelAttribution(),
    ...extra,
  };

  fetch(RBR_FUNNEL_TRACK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch((trackingError) => {
    console.warn(
      '[RBR funnel] existing-report payment event failed:',
      eventName,
      trackingError
    );
  });
}

// Fire Google Ads conversion safely (once per paymentId)
function fireGoogleAdsPurchase({ paymentId, valueINR }) {
  try {
    if (!paymentId) return;
    const guardKey = `ads_conv_fired_${paymentId}`;
    if (sessionStorage.getItem(guardKey)) {
      console.log('[Ads] Conversion already fired for', paymentId);
      return;
    }
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: CONVERSION_SEND_TO,
        value: Number(valueINR) || 1.0,
        currency: REGION.currencyCode,
        transaction_id: paymentId,
      });
      sessionStorage.setItem(guardKey, '1');
      console.log('[Ads] Conversion fired:', { paymentId, valueINR });
    } else {
      console.warn('[Ads] gtag not available; skip fire.');
    }
  } catch (e) {
    console.error('[Ads] Conversion fire error:', e);
  }
}

const Payment = () => {
  // 🔍 Debug: see what React sees from .env at runtime
  console.log(
    'FRONTEND RAZORPAY KEY FROM ENV (process.env):',
    process.env.REACT_APP_RAZORPAY_KEY_ID
  );

  // Pull userInfo and report from state
  const {
    state: { userInfo, report },
    dispatch: cxtDispatch,
  } = useContext(Store);

  const storeFileKey = report?.fileKey || '';
  const storeReportId = report?.reportId || '';
  const { isLogin, userId } = userInfo || {};

  const navigate = useNavigate();
  const location = useLocation();

  // ---- Helpers to resolve values safely from multiple sources ----
  const stateObj = location?.state || {};

  const resolvedReportId =
    stateObj.reportId ||
    stateObj.report_id ||
    storeReportId ||
    localStorage.getItem('reportId') ||
    localStorage.getItem('lastReportId') || // optional extra fallback
    '';

  const resolvedAmount =
    stateObj.amount ??
    (localStorage.getItem('amount')
      ? Number(localStorage.getItem('amount'))
      : undefined) ??
    1; // default ₹1 fallback

  const resolvedFileKey =
    stateObj.fileKey ||
    stateObj.file_key ||
    storeFileKey ||
    localStorage.getItem('fileKey') ||
    '';

  const resolvedReportSlug =
    stateObj.reportSlug ||
    stateObj.report_slug ||
    report?.reportSlug ||
    report?.report_slug ||
    localStorage.getItem('reportSlug') ||
    '';

  const resolvedReportTitle =
    stateObj.reportTitle ||
    stateObj.report_title ||
    report?.reportTitle ||
    report?.report_title ||
    localStorage.getItem('reportTitle') ||
    '';

  const resolvedCurrency =
    stateObj.currency ||
    report?.currency ||
    REGION.currencyCode;

  // Prefer values from userInfo, fallback to localStorage
  const storedName = localStorage.getItem('userName') || (userInfo?.name ?? '');
  const storedPhone =
    localStorage.getItem('userPhone') || (userInfo?.phone ?? userId);
  const storedEmail = localStorage.getItem('userEmail') || (userInfo?.email ?? '');

  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [inputName, setInputName] = useState(storedName);
  const [inputEmail, setInputEmail] = useState(storedEmail);
  const [verify, setVerify] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Local reactive copies for logging & validation
  const reportId = resolvedReportId;
  const amount = resolvedAmount;
  const file_key = resolvedFileKey;
  const funnelReportQuery =
    resolvedReportTitle || resolvedReportSlug || reportId || '';
  const isTestPayment = Number(amount || 0) === 1;

  // Diagnostic: prove that the deployed Payment.js page itself was reached.
  useEffect(() => {
    const sessionId = getRbrFunnelSessionId();
    const guardKey = `rbr_payment_page_viewed_${sessionId}_${reportId || 'unknown'}`;

    try {
      if (sessionStorage.getItem(guardKey)) return;
      sessionStorage.setItem(guardKey, '1');
    } catch {
      // If storage is unavailable, still send the diagnostic event.
    }

    trackExistingReportPaymentEvent({
      eventName: 'existing_report_payment_page_viewed',
      reportQuery: funnelReportQuery,
      extra: {
        product_type: 'existing_report',
        selected_product: resolvedReportSlug || reportId,
        displayed_price: Number(amount || 0),
        currency: resolvedCurrency,
        is_test_payment: isTestPayment,
      },
    });
  }, [
    reportId,
    funnelReportQuery,
    resolvedReportSlug,
    amount,
    resolvedCurrency,
    isTestPayment,
  ]);

  // Persist payment context so refresh doesn't lose it
  useEffect(() => {
    if (reportId) {
      localStorage.setItem('reportId', reportId);
      localStorage.setItem('lastReportId', reportId);
    }
    if (file_key) localStorage.setItem('fileKey', file_key);
    if (amount != null) localStorage.setItem('amount', String(amount));
    if (resolvedReportSlug) localStorage.setItem('reportSlug', resolvedReportSlug);
    if (resolvedReportTitle) localStorage.setItem('reportTitle', resolvedReportTitle);
    try {
      if (reportId) cxtDispatch({ type: 'SET_REPORT_ID', payload: reportId });
      if (file_key) cxtDispatch({ type: 'SET_FILE_KEY', payload: file_key });
    } catch {
      // ignore if reducer doesn't handle these
    }
  }, [
    reportId,
    file_key,
    amount,
    resolvedReportSlug,
    resolvedReportTitle,
    cxtDispatch,
  ]);

  useEffect(() => {
    console.log('Payment.js - Initial state:', {
      isLogin,
      userId,
      reportId,
      amount,
      file_key,
      locationState: location?.state,
    });

    if (!isLogin) {
      navigate('/');
      return;
    }

    let scriptLoaded = false;
    try {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        scriptLoaded = true;
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        setError('Failed to load payment gateway. Please try again later.');
        scriptLoaded = false;
      };
      document.body.appendChild(script);

      setTimeout(() => {
        if (!scriptLoaded) {
          console.error('Razorpay script timeout');
          setError('Payment gateway timed out. Please refresh.');
        }
      }, 5000);
    } catch (e) {
      console.error('Error loading Razorpay script:', e.message);
      setError('Error initializing payment gateway.');
    }

    return () => {
      const script = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (script) document.body.removeChild(script);
    };
  }, [isLogin, userId, navigate, location?.state]);

  const saveUserDetails = async () => {
    try {
      const response = await fetch(
        'https://eg3s8q87p7.execute-api.ap-south-1.amazonaws.com/default/manage-user-profile',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            phone_number: storedPhone,
            name: inputName,
            email: inputEmail,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error saving user details:', errorData.error || 'Unknown error');
      } else {
        console.log('User details saved successfully');
      }
    } catch (err) {
      console.error('Save user details error:', err);
    }
  };

  const handleName = (e) => {
    if (e.key === 'Enter') {
      if (!inputName.trim()) {
        setError('Name cannot be empty');
        return;
      }
      cxtDispatch({ type: 'SET_NAME', payload: inputName });
      localStorage.setItem('userName', inputName);
      saveUserDetails();
      setEditName(false);
    }
  };

  const handleEmail = (e) => {
    if (e.key === 'Enter') {
      if (!inputEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputEmail)) {
        setError('Please enter a valid email');
        return;
      }
      cxtDispatch({ type: 'SET_EMAIL', payload: inputEmail });
      localStorage.setItem('userEmail', inputEmail);
      saveUserDetails();
      setEditEmail(false);
      setSuccess(true);
    }
  };

  const ensureRazorpayLoaded = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        console.log('Razorpay SDK already loaded');
        return resolve(true);
      }
      console.log('Loading Razorpay SDK...');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('Razorpay SDK loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        console.error('Razorpay SDK failed to load');
        reject(new Error('Razorpay SDK failed to load'));
      };
      document.body.appendChild(script);
      setTimeout(() => {
        if (!window.Razorpay) {
          console.error('Razorpay SDK load timeout');
          reject(new Error('Razorpay SDK load timeout'));
        }
      }, 10000);
    });

  const handlePayment = async () => {
    trackExistingReportPaymentEvent({
      eventName: 'existing_report_pay_now_clicked',
      reportQuery: funnelReportQuery,
      extra: {
        product_type: 'existing_report',
        selected_product: resolvedReportSlug || reportId,
        displayed_price: Number(amount || 0),
        currency: resolvedCurrency,
        is_test_payment: isTestPayment,
      },
    });

    console.log('handlePayment started', {
      reportId,
      amount,
      file_key,
      userId,
      inputName,
      inputEmail,
      verify,
      authToken: localStorage.getItem('authToken'),
      userInfoToken: userInfo?.token,
    });

    setError('');
    setLoading(true);

    // Step 1: Validate inputs individually
    if (!reportId) {
      console.error('Validation failed: Missing reportId');
      setError('Missing report reference. Please select a report.');
      setLoading(false);
      return;
    }
    if (!userId) {
      console.error('Validation failed: Missing userId');
      setError('Please log in again.');
      navigate('/login');
      setLoading(false);
      return;
    }
    if (!inputName.trim()) {
      console.error('Validation failed: Missing name');
      setError('Please enter your name.');
      setLoading(false);
      return;
    }
    if (!inputEmail.trim()) {
      console.error('Validation failed: Missing email');
      setError('Please enter your email.');
      setLoading(false);
      return;
    }
    if (!verify) {
      console.error('Validation failed: Terms not accepted');
      setError('Please agree to the terms and conditions.');
      setLoading(false);
      return;
    }
    if (!amount || isNaN(amount)) {
      console.error('Validation failed: Invalid amount', { amount });
      setError('Invalid payment amount.');
      setLoading(false);
      return;
    }

    // Step 2: Ensure Razorpay SDK is loaded
    try {
      await ensureRazorpayLoaded();
      console.log('Razorpay SDK confirmed:', !!window.Razorpay);
    } catch (e) {
      console.error('Razorpay SDK error:', e.message);
      setError('Failed to load payment gateway. Please refresh the page.');
      setLoading(false);
      return;
    }

    // Step 3: Fetch Razorpay order
    try {
      const token = localStorage.getItem('authToken') || userInfo?.token;
      if (!token) {
        console.error('No auth token found in localStorage or userInfo');
        setError('Authentication error. Please log in again and retry.');
        navigate('/login');
        setLoading(false);
        return;
      }

      console.log('Fetching create-razorpay-order with:', {
        body: JSON.stringify({
          reportId,
          amount: Math.round(Number(amount) * 100),
          userId,
        }),
      });

      const response = await fetch(
        'https://d7vdzrifz9.execute-api.ap-south-1.amazonaws.com/prod/create-razorpay-order',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            body: JSON.stringify({
              reportId,
              amount: Math.round(Number(amount) * 100),
              userId,
            }),
          }),
        }
      );

      console.log('create-razorpay-order response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('create-razorpay-order error:', errorText);
        setError(`Failed to initiate payment: ${errorText || 'Server error'}`);
        setLoading(false);
        return;
      }

      const order = await response.json();
      console.log('Razorpay order response:', order);
      const parsedBody = JSON.parse(order.body);

      // ---- Step 4: Resolve order details (PREFER server key_id) ----
      const orderId = parsedBody?.razorpay_response?.id;
      const orderAmount =
        parsedBody?.razorpay_response?.amount || Math.round(Number(amount) * 100);
      const orderCurrency = parsedBody?.razorpay_response?.currency || 'INR';
      const keyFromOrder = parsedBody?.key_id || null;

      const razorpayKey =
        keyFromOrder ||
        process.env.REACT_APP_RAZORPAY_KEY_ID ||
        (typeof window !== 'undefined' && window._env_?.RAZORPAY_KEY_ID) ||
        localStorage.getItem('razorpayKey') ||
        null;

      console.log(
        'ENV RAZORPAY KEY (inside handlePayment):',
        process.env.REACT_APP_RAZORPAY_KEY_ID
      );
      console.log('keyFromOrder:', keyFromOrder);
      console.log('Resolved Razorpay key:', razorpayKey, 'Order ID:', orderId);

      if (!razorpayKey) {
        console.error('Razorpay key missing');
        setError('Payment configuration error. Please contact support.');
        setLoading(false);
        return;
      }
      if (!orderId) {
        console.error('Order ID missing in response:', order);
        setError('Payment could not be initialized. Please retry.');
        setLoading(false);
        return;
      }

      trackExistingReportPaymentEvent({
        eventName: 'existing_report_order_created',
        reportQuery: funnelReportQuery,
        extra: {
          product_type: 'existing_report',
          selected_product: resolvedReportSlug || reportId,
          displayed_price: Number(amount || 0),
          amount_minor: Number(orderAmount || 0),
          currency: resolvedCurrency,
          razorpay_order_id: orderId,
          is_test_payment: isTestPayment,
        },
      });

      console.log('Opening Razorpay popup with order:', orderId);

      // Step 5: Initialize Razorpay
      const options = {
        key: razorpayKey,
        amount: orderAmount,
        currency: orderCurrency,
        name: 'Rajan Business Ideas Pvt. Ltd',
        description: `Purchase of report ${reportId}`,
        image: '/logo.svg',
        order_id: orderId,
        handler: async (response) => {
          try {
            console.log('Verifying payment with:', {
              reportId,
              userId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            const verifyResponse = await fetch(
              'https://d7vdzrifz9.execute-api.ap-south-1.amazonaws.com/prod/verify-payment',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  body: JSON.stringify({
                    reportId,
                    userId,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                  }),
                }),
              }
            );

            console.log('verify-payment response status:', verifyResponse.status);
            if (!verifyResponse.ok) {
              const verifyError = await verifyResponse.text();
              throw new Error(
                `Verification failed: ${verifyError || 'Unknown server error'}`
              );
            }

            const verifyData = await verifyResponse.json();
            console.log('Payment verification response:', verifyData);

            // Log outcome for your backend
            await fetch(
              'https://d7vdzrifz9.execute-api.ap-south-1.amazonaws.com/prod/log_payment',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  reportId,
                  file_key,
                  userId,
                  status: 'success',
                  amount: Math.round(Number(amount) * 100),
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                  timestamp: new Date().toISOString(),
                }),
              }
            );

            // ✅ First-party funnel: verified existing-report purchase.
            trackExistingReportPaymentEvent({
              eventName: 'existing_report_purchase',
              reportQuery: funnelReportQuery,
              extra: {
                product_type: 'existing_report',
                selected_product: resolvedReportSlug || reportId,
                displayed_price: Number(amount || 0),
                paid_value: Number(amount || 0),
                amount_minor: Math.round(Number(amount || 0) * 100),
                currency: resolvedCurrency,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                is_test_payment: isTestPayment,
              },
            });

            // ✅ Fire Google Ads Purchase conversion (once per payment id).
            // Preserve live conversion behavior, but never count the protected ₹1 test.
            if (!isTestPayment) {
              fireGoogleAdsPurchase({
                paymentId: response.razorpay_payment_id,
                valueINR: Number(amount),
              });
            } else {
              console.log('[Ads] ₹1 test payment detected; conversion skipped.', {
                paymentId: response.razorpay_payment_id,
              });
            }

            // ✅ Save user details then go to Purchase Success screen
            await saveUserDetails();

            navigate('/purchase-success', {
              replace: true,
              state: {
                amount: Number(amount),
                reportId,
                fileKey: file_key,
                razorpayPaymentId: response.razorpay_payment_id,
                loggedIn: true,
              },
            });
          } catch (err) {
            console.error('Payment verification error:', err.message, err.stack);
            setError(`Payment verification failed: ${err.message}`);
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: inputName,
          email: inputEmail,
          contact: storedPhone,
        },
        notes: {
          file_key,
          reportId,
          address: 'Rajan Business Ideas Office',
        },
        theme: {
          color: '#3399cc',
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal closed by user');

            trackExistingReportPaymentEvent({
              eventName: 'existing_report_payment_cancelled',
              reportQuery: funnelReportQuery,
              extra: {
                product_type: 'existing_report',
                selected_product: resolvedReportSlug || reportId,
                displayed_price: Number(amount || 0),
                amount_minor: Number(orderAmount || 0),
                currency: resolvedCurrency,
                razorpay_order_id: orderId,
                is_test_payment: isTestPayment,
              },
            });

            setError('Payment cancelled. Please try again.');
            setLoading(false);
          },
        },
      };

      console.log('Razorpay options:', options);

      // Step 6: Open Razorpay modal
      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async (response) => {
          console.error('Payment failed:', response?.error?.description);

          trackExistingReportPaymentEvent({
            eventName: 'existing_report_payment_failed',
            reportQuery: funnelReportQuery,
            extra: {
              product_type: 'existing_report',
              selected_product: resolvedReportSlug || reportId,
              displayed_price: Number(amount || 0),
              amount_minor: Number(orderAmount || 0),
              currency: resolvedCurrency,
              razorpay_payment_id: response?.error?.metadata?.payment_id || '',
              razorpay_order_id: orderId,
              is_test_payment: isTestPayment,
            },
          });

          setError(`Payment failed: ${response?.error?.description || 'Unknown'}`);
          await fetch(
            'https://d7vdzrifz9.execute-api.ap-south-1.amazonaws.com/prod/log_payment',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                reportId,
                file_key,
                userId,
                status: 'failed',
                amount: Math.round(Number(amount) * 100),
                razorpayPaymentId: response?.error?.metadata?.payment_id || null,
                razorpayOrderId: orderId,
                razorpaySignature: null,
                timestamp: new Date().toISOString(),
              }),
            }
          );
          setLoading(false);
        });

        console.log('Opening Razorpay modal');

        trackExistingReportPaymentEvent({
          eventName: 'existing_report_razorpay_open_attempt',
          reportQuery: funnelReportQuery,
          extra: {
            product_type: 'existing_report',
            selected_product: resolvedReportSlug || reportId,
            displayed_price: Number(amount || 0),
            amount_minor: Number(orderAmount || 0),
            currency: resolvedCurrency,
            razorpay_order_id: orderId,
            is_test_payment: isTestPayment,
          },
        });

        rzp.open();

        trackExistingReportPaymentEvent({
          eventName: 'existing_report_razorpay_opened',
          reportQuery: funnelReportQuery,
          extra: {
            product_type: 'existing_report',
            selected_product: resolvedReportSlug || reportId,
            displayed_price: Number(amount || 0),
            amount_minor: Number(orderAmount || 0),
            currency: resolvedCurrency,
            razorpay_order_id: orderId,
            is_test_payment: isTestPayment,
          },
        });
      } catch (err) {
        console.error('Razorpay initialization error:', err.message);

        trackExistingReportPaymentEvent({
          eventName: 'existing_report_razorpay_open_failed',
          reportQuery: funnelReportQuery,
          extra: {
            product_type: 'existing_report',
            selected_product: resolvedReportSlug || reportId,
            displayed_price: Number(amount || 0),
            currency: resolvedCurrency,
            error_stage: 'razorpay_initialization_or_open',
            is_test_payment: isTestPayment,
          },
        });

        setError(`Failed to open payment gateway: ${err.message}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Payment initiation error:', error.message, error.stack);
      setError(`Failed to initiate payment: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="payments-page" style={{ position: 'relative', zIndex: 1000 }}>
      {/* Left Section */}
      <div className="payments-left">
        <div className="row" style={{ textAlign: 'center' }}>
          <img
            src={Personal}
            alt="Personal"
            style={{ width: '187px', height: '36px', marginLeft: '15%' }}
          />
        </div>

        {/* Name */}
        <div className="payment-name mt-2">
          <div style={{ paddingRight: '20px' }}>
            <label style={{ fontSize: '20px', fontWeight: '600' }}>Name:</label>
          </div>
          <div style={{ paddingRight: '30px' }}>
            {editName ? (
              <input
                id="nameInput"
                className="edit-input"
                style={{
                  border: 'none',
                  background: 'transparent',
                  borderBottom: '1px solid #0263c7',
                  width: '90%',
                }}
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={handleName}
              />
            ) : (
              <p style={{ fontSize: '20px', fontWeight: '400' }}>{inputName}</p>
            )}
          </div>
          <div>
            <img
              src={pencil}
              alt="Edit name"
              onClick={() => setEditName(!editName)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="payment-name mt-2">
          <div style={{ paddingRight: '20px' }}>
            <label style={{ fontSize: '20px', fontWeight: '600' }}>
              Phone Number:
            </label>
          </div>
          <div style={{ paddingRight: '30px' }}>
            <p style={{ fontSize: '20px', fontWeight: '400' }}>{storedPhone}</p>
          </div>
        </div>

        <div className="row mt-2" style={{ textAlign: 'center' }}>
          <img
            src={Delivery}
            alt="Delivery"
            style={{ width: '187px', height: '36px', marginLeft: '15%' }}
          />
        </div>

        {/* Email */}
        <div className="payment-name mt-3">
          <div style={{ paddingRight: '20px' }}>
            <label style={{ fontSize: '20px', fontWeight: '600' }}>Email:</label>
          </div>
          <div style={{ paddingRight: '30px' }}>
            {editEmail ? (
              <input
                id="emailInput"
                className="edit-input"
                style={{
                  border: 'none',
                  background: 'transparent',
                  borderBottom: '1px solid #0263c7',
                  width: '90%',
                }}
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                onKeyDown={handleEmail}
              />
            ) : (
              <p style={{ fontSize: '20px', fontWeight: '400' }}>{inputEmail}</p>
            )}
          </div>
          <div>
            <img
              src={pencil}
              alt="Edit email"
              onClick={() => setEditEmail(!editEmail)}
              style={{ cursor: 'pointer' }}
            />
          </div>
        </div>

        {success && (
          <div
            className="success-message"
            style={{
              marginLeft: '20%',
              marginTop: '5%',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <div>
              <img src={green} alt="Success" />
            </div>
            <div>Your email id has been changed successfully</div>
          </div>
        )}

        <div className="form-check" style={{ paddingLeft: '25%', paddingTop: '5%' }}>
          <input
            className="form-check-input"
            type="checkbox"
            id="verify"
            checked={verify}
            onChange={(e) => setVerify(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="verify">
            <p className="text-secondary">
              I agree to all terms{' '}
              <span className="text-primary">Terms & Conditions</span>
            </p>
          </label>
        </div>
      </div>

      {/* Right Section */}
      <div className="payments-right">
        <div className="row">
          <p className="pay-price">Total Price: {REGION.currencySymbol}{amount || 0}</p>
        </div>
        <div className="row">
          <button
            type="button"
            onClick={handlePayment}
            className="pay-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
        {error && (
          <div className="row">
            <p className="error-message">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
