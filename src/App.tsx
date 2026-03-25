/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import Home from './pages/Home';
import Predictions from './pages/Predictions';
import LiveScores from './pages/LiveScores';
import Leagues from './pages/Leagues';
import MatchDetails from './pages/MatchDetails';
import LeaguePredictions from './pages/LeaguePredictions';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import SubmitTip from './pages/SubmitTip';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import AdminRoute from './components/AdminRoute';
import { AdManager } from './components/AdManager';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-green-500/30 selection:text-green-900">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/live" element={<LiveScores />} />
            <Route path="/leagues" element={<Leagues />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/match/:id" element={<MatchDetails />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/submit-tip" element={<SubmitTip />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/ads" element={
              <AdminRoute>
                <AdManager />
              </AdminRoute>
            } />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/:leagueSlug" element={<LeaguePredictions />} />
          </Routes>
        </main>
        
        <Footer />
        <CookieConsent />
      </div>
    </Router>
  );
}
