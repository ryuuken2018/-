import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Index } from './pages/Index';
import { Garden } from './pages/Garden';
import { PetPage } from './pages/PetPage';
import { Race } from './pages/Race';
import { NotFound } from './pages/NotFound';
import { ParentControlPanel } from './components/ParentControlPanel';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <ParentControlPanel />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/garden" element={<Garden />} />
            <Route path="/pet/:id" element={<PetPage />} />
            <Route path="/race" element={<Race />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
