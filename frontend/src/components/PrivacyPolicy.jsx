// src/components/PrivacyPolicy.jsx
import React from 'react';
import './Policy.css';

const PrivacyPolicy = () => {
  return (
    <div className="policy-container">
      <h1>Privacy Policy</h1>
      <p>
        At RajanBusinessReports.in, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and share your data when you use our website RajanBusinessReports.in to generate and purchase reports. By using our services, you agree to the terms outlined in this policy.
      </p>

      <h2>1. Information We Collect</h2>
      <p>We collect the following types of information:</p>
      <ul>
        <li>
          <strong>Personal Information:</strong> When you create an account, purchase a report, or contact us, we may collect your name, email address, phone number, billing address, and payment details (processed securely via Razorpay).
        </li>
        <li>
          <strong>Report-Related Data:</strong> Information about the filters you select and the reports you generate to provide the requested services.
        </li>
        <li>
          <strong>Usage Data:</strong> Details about how you interact with our website, such as IP address, browser type, pages visited, and timestamps, collected through cookies and similar technologies.
        </li>
        <li>
          <strong>Payment Information:</strong> Payment details (e.g., card or UPI information) are securely handled by our payment gateway provider, Razorpay, and we do not store sensitive payment data on our servers.
        </li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use your data to:</p>
      <ul>
        <li>Process your report requests and deliver the generated reports.</li>
        <li>Handle payments, refunds, and cancellations through Razorpay’s secure platform.</li>
        <li>Communicate with you about your account, purchases, or support queries.</li>
        <li>Improve our website and services by analyzing usage patterns.</li>
        <li>Comply with legal obligations, such as tax reporting or KYC (Know Your Customer) requirements.</li>
      </ul>

      <h2>3. How We Share Your Information</h2>
      <p>We do not sell or rent your personal information. We may share your data with:</p>
      <ul>
        <li>
          <strong>Razorpay:</strong> To process payments, refunds, or cancellations securely. Razorpay’s handling of your data is governed by their{' '}
          <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>.
        </li>
        <li>
          <strong>Service Providers:</strong> Third-party vendors (e.g.,这款

System: Based on the provided code and requirements, I'll help you integrate the Refund and Cancellation Policy and Privacy Policy pages into your React app, ensuring they match the styling and format of the provided `.docx` files while aligning with your app's existing design.

---

### Implementation Steps

#### 1. Create Policy Components
We'll create `RefundPolicy.jsx` and `PrivacyPolicy.jsx` to render the policy content.

**`src/components/RefundPolicy.jsx`:**
```jsx
import React from 'react';
import './Policy.css';

const RefundPolicy = () => {
  return (
    <div className="policy-container">
      <h1 className="policy-title">Refund and Cancellation Policy</h1>
      <p className="policy-text">
        At RajanBusinessReports.in, we strive to ensure you are satisfied with your purchase of our detailed reports. This Refund and Cancellation Policy outlines the terms under which refunds or cancellations are processed for reports purchased on our platform. Please read this policy carefully before making a purchase.
      </p>

      <h2 className="policy-subtitle">1. Eligibility for Refunds</h2>
      <p className="policy-text">We offer refunds under the following circumstances:</p>
      <ul className="policy-list">
        <li><strong>Non-Delivery of Report:</strong> If the report you purchased is not generated or delivered due to a technical issue on our end, you are eligible for a full refund.</li>
        <li><strong>Incorrect Report Generated:</strong> If the report does not match the filters or criteria you selected due to an error in our system, you may request a refund or a corrected report.</li>
        <li><strong>Duplicate Transactions:</strong> If you are charged multiple times for the same report due to a payment error, we will refund the duplicate charges.</li>
      </ul>
      <p className="policy-text">Refunds will not be issued for:</p>
      <ul className="policy-list">
        <li>User errors, such as selecting incorrect filters or misunderstanding the report’s scope.</li>
        <li>Dissatisfaction with the report’s content if it meets the specified criteria and is delivered as promised.</li>
        <li>Purchases made more than 7 days ago, unless required by law.</li>
      </ul>

      <h2 className="policy-subtitle">2. Cancellation of Purchase</h2>
      <ul className="policy-list">
        <li>Once a report is generated and made available for viewing, the purchase cannot be cancelled, as the service is considered fulfilled.</li>
        <li>If you wish to cancel a transaction before the report is generated (e.g., during payment processing), please contact us immediately at <a href="mailto:support@rajanbusinessIdeas.com">support@rajanbusinessIdeas.com</a>. We will review the request and process a refund if the report has not been generated.</li>
      </ul>

      <h2 className="policy-subtitle">3. Refund Process</h2>
      <p className="policy-text">To request a refund:</p>
      <ul className="policy-list">
        <li>Contact us at <a href="mailto:support@rajanbusinessIdeas.com">support@rajanbusinessIdeas.com</a> or +91 9014794288 within 24 hours of the purchase.</li>
        <li>Provide your order ID, email used for the purchase, and a brief description of the issue.</li>
        <li>Our team will review your request within 2-3 business days and notify you of the outcome.</li>
      </ul>
      <p className="policy-text">Approved refunds will be processed to the original payment method used for the transaction. Refunds typically take 5-7 business days to reflect in your account, depending on your bank or payment provider’s processing times.</p>

      <h2 className="policy-subtitle">4. Chargebacks</h2>
      <p className="policy-text">If you initiate a chargeback with your bank or payment provider without first contacting us, we reserve the right to investigate the claim. Unjustified chargebacks may result in restricted access to our platform.</p>

      <h2 className="policy-subtitle">5. Contact Us</h2>
      <p className="policy-text">For any questions or assistance with refunds or cancellations, please reach out to us:</p>
      <ul className="policy-list">
        <li><strong>Email:</strong> <a href="mailto:support@rajanbusinessIdeas.com">support@rajanbusinessIdeas.com</a></li>
        <li><strong>Phone:</strong> +91 9014794288</li>
        <li><strong>Support Hours:</strong> Monday to Friday, 9 AM to 6 PM IST</li>
      </ul>
      <p className="policy-text">We reserve the right to update this policy at any time. Changes will be posted on this page with an updated effective date.</p>
      <p className="policy-text"><strong>Last Updated:</strong> April 14, 2025</p>
    </div>
  );
};

export default RefundPolicy;
