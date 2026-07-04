import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from '@features/home/HomePage';
import { MissionDetailPage } from '@features/missions/MissionDetailPage';
import { MissionsPage } from '@features/missions/MissionsPage';
import { DiscoverPage } from '@features/discover/DiscoverPage';
import { LeadDetailPage } from '@features/leads/LeadDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/missions/:missionId" element={<MissionDetailPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/leads/:leadId" element={<LeadDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
