import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from '@features/home/HomePage';
import { MissionsPage } from '@features/missions/MissionsPage';
import { DiscoverPage } from '@features/discover/DiscoverPage';
import { LeadDetailPage } from '@features/leads/LeadDetailPage';
import { InsightsPage } from '@features/insights/InsightsPage';
import { PlaceholderPage } from '@features/placeholder/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/leads/:leadId" element={<LeadDetailPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/pipeline" element={<PlaceholderPage title="Pipeline" />} />
          <Route path="/contacts" element={<PlaceholderPage title="Contacts" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
