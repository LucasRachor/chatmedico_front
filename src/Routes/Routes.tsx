import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login/Login";
import PatientListScreen from "../pages/Patient";
import HealthRiskForm from "../pages/HealthRiskForm";
import ManageQuestions from "../pages/ManageQuestions";
import PatientHome from "../pages/PatientHome";
import MedicalChat from "../pages/MedicalChat";
import ProtectedRoute from "../Components/ProtectedRoute/ProtectedRoute";
import NotFound from "../pages/NotFound";
import Register from "../pages/Register/Register";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />
        
        {/* Rotas protegidas para médicos */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["medico", "enfermeiro"]}>
              <PatientListScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manageQuestions"
          element={
            <ProtectedRoute allowedRoles={["medico", "enfermeiro"]}>
              <ManageQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medicalChat"
          element={
            <ProtectedRoute allowedRoles={["medico", "paciente", "enfermeiro"]}>
              <MedicalChat />
            </ProtectedRoute>
          }
        />

        {/* Rotas protegidas para pacientes */}
        <Route
          path="/patientHome"
          element={
            <ProtectedRoute allowedRoles={["paciente"]}>
              <PatientHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/healthRiskForm"
          element={
            <ProtectedRoute allowedRoles={["paciente"]}>
              <HealthRiskForm />
            </ProtectedRoute>
          }
        />
        { <Route path="*" element={<NotFound />} /> }
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
