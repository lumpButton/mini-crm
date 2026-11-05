import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { ObjectPage } from "./pages/ObjectPage";
import { ObjectsPage } from "./pages/ObjectsPage";
import { TaskPage } from "./pages/TaskPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<ObjectsPage />} />
          <Route path="objects/:id" element={<ObjectPage />} />
          <Route path="tasks/:id" element={<TaskPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
