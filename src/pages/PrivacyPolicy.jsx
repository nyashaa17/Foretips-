import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white py-24">
      <SEO
        title="Privacy Policy"
        description="Privacy Policy for Foretips - How we collect, use, and protect your data."
      />
      <Breadcrumbs />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-slate-700">
        <h1 className="text-4xl font-black text-slate-900 mb-12">Privacy Policy – Foretips</h1>
        <p>At Foretips, we value your privacy and are committed to protecting your personal information.</p>

        <h2 className="text-2xl font-bold text-slate-900">1. Information We Collect</h2>
        <p>We may collect the following information:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Basic account details (such as email and username)</li>
          <li>User-generated content (predictions, comments)</li>
          <li>Usage data (how you interact with the platform)</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Provide and improve our prediction services</li>
          <li>Manage user accounts and leaderboards</li>
          <li>Display user-generated predictions</li>
          <li>Improve user experience</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">3. Cookies & Tracking</h2>
        <p>Foretips may use cookies and similar technologies to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Enhance your browsing experience</li>
          <li>Analyze site traffic</li>
          <li>Serve relevant advertisements</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">4. Third-Party Services</h2>
        <p>We may use third-party services such as:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Analytics tools</li>
          <li>Advertising networks (e.g., AdMob)</li>
        </ul>
        <p>These services may collect information according to their own privacy policies.</p>

        <h2 className="text-2xl font-bold text-slate-900">5. Data Security</h2>
        <p>We take reasonable measures to protect your data, but no method of transmission over the internet is 100% secure.</p>

        <h2 className="text-2xl font-bold text-slate-900">6. User Content</h2>
        <p>Any predictions or content you post may be visible to other users on the platform.</p>

        <h2 className="text-2xl font-bold text-slate-900">7. Your Rights</h2>
        <p>You may request to update or delete your account information at any time.</p>

        <h2 className="text-2xl font-bold text-slate-900">8. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Changes will be posted on this page.</p>

        <h2 className="text-2xl font-bold text-slate-900">9. Contact Us</h2>
        <p>If you have any questions, contact us at: <a href="mailto:Foretips@proton.me" className="text-green-600 hover:underline">Foretips@proton.me</a></p>
      </div>
    </div>
  );
}
