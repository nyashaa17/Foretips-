import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white py-24">
      <SEO
        title="Terms of Service"
        description="Terms of Service for Foretips - Rules and guidelines for using our platform."
      />
      <Breadcrumbs />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-slate-700">
        <h1 className="text-4xl font-black text-slate-900 mb-12">Terms of Service – Foretips</h1>
        <p>By using Foretips, you agree to the following terms:</p>

        <h2 className="text-2xl font-bold text-slate-900">1. Use of the Platform</h2>
        <p>Foretips provides football predictions for informational purposes only. We do not guarantee the accuracy or outcomes of any predictions.</p>

        <h2 className="text-2xl font-bold text-slate-900">2. No Gambling Advice</h2>
        <p>Our content is not financial or gambling advice. Users are responsible for their own betting decisions.</p>

        <h2 className="text-2xl font-bold text-slate-900">3. User Accounts</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>You are responsible for maintaining your account</li>
          <li>You agree not to post harmful, abusive, or misleading content</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">4. User-Generated Content</h2>
        <p>By posting predictions, you:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Grant Foretips the right to display your content</li>
          <li>Agree not to post spam or false information</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">5. Leaderboard & Rankings</h2>
        <p>Leaderboard rankings are based on user activity and performance and may change at any time.</p>

        <h2 className="text-2xl font-bold text-slate-900">6. Limitation of Liability</h2>
        <p>Foretips is not responsible for:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Any financial losses</li>
          <li>Decisions made based on predictions</li>
        </ul>

        <h2 className="text-2xl font-bold text-slate-900">7. Termination</h2>
        <p>We reserve the right to suspend or terminate accounts that violate our terms.</p>

        <h2 className="text-2xl font-bold text-slate-900">8. Changes to Terms</h2>
        <p>We may update these Terms at any time. Continued use means you accept the changes.</p>

        <h2 className="text-2xl font-bold text-slate-900">9. Governing Law</h2>
        <p>These terms are governed by applicable laws in your region.</p>
      </div>
    </div>
  );
}
