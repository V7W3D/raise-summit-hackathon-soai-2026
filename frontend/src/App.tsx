import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from '@features/home/HomePage';
import { MissionDetailPage } from '@features/missions/MissionDetailPage';
import { EditMissionPage } from '@features/missions/EditMissionPage';
import { CreateMissionPage } from '@features/missions/CreateMissionPage';
import { EditBusinessProfilePage } from '@features/missions/EditBusinessProfilePage';
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
          <Route path="/missions/new" element={<CreateMissionPage />} />
          <Route path="/profile" element={<EditBusinessProfilePage />} />
          <Route path="/missions/:missionId/edit" element={<EditMissionPage />} />
          <Route path="/missions/:missionId" element={<MissionDetailPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/leads/:leadId" element={<LeadDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
