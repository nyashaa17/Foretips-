/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ScrollToTop from './components/ScrollToTop';
import CookieConsent from './components/CookieConsent';
import Layout from './components/Layout';
const Home = lazy(() => import('./pages/Home'));
const Predictions = lazy(() => import('./pages/Predictions'));
const LiveScores = lazy(() => import('./pages/LiveScores'));
const Leagues = lazy(() => import('./pages/Leagues'));
const MatchDetails = lazy(() => import('./pages/MatchDetails'));
import TeamDetails from './pages/TeamDetails';
import PlayerDetails from './pages/PlayerDetails';
const LeaguePredictions = lazy(() => import('./pages/LeaguePredictions'));
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import About from './pages/About';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import SubmitTip from './pages/SubmitTip';
import Leaderboard from './pages/Leaderboard';
const Dashboard = lazy(() => import('./pages/Dashboard'));
import UserProfile from './pages/UserProfile';
import AdminRoute from './components/AdminRoute';
import { AdManager } from './components/AdManager';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-green-500/30 selection:text-green-900">
        <Suspense fallback={<div className="min-h-screen bg-white"></div>}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/live" element={<LiveScores />} />
              <Route path="/leagues" element={<Leagues />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/team/:teamId" element={<TeamDetails />} />
              <Route path="/player/:playerId" element={<PlayerDetails />} />
              <Route path="/match/:id" element={<MatchDetails />} />
              <Route path="/event/:id" element={<MatchDetails />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/submit-tip" element={<SubmitTip />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
              <Route path="/admin/ads" element={
                <AdminRoute>
                  <AdManager />
                </AdminRoute>
              } />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/:leagueSlug" element={<LeaguePredictions />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
        <CookieConsent />
      </div>
    </Router>
  );
}
