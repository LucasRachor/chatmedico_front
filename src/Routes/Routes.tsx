import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login/Login";
import PatientListScreen from "../pages/Patient";
import HealthRiskForm from "../pages/HealthRiskForm";
import ManageQuestions from "../pages/ManageQuestions";
import PatientHome from "../pages/PatientHome";
import MedicalChat from "../pages/MedicalChat";
import PatientRegistration from "../pages/PatientRegistration";
import ProtectedRoute from "../Components/ProtectedRoute/ProtectedRoute";
import NotFound from "../pages/NotFound";
import ManageProfessionals from "../pages/ManageProfessionals/ManageProfessionals";
import PatientHistory from "../pages/PatientHistory/PatientHistory";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<PatientRegistration />} />

        {/* Rotas protegidas para admins */}
        <Route
          path="/manage-professionals"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageProfessionals />
            </ProtectedRoute>
          }
        />

        {/* Rotas protegidas para médicos */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["medico", "enfermeiro", "admin"]}>
              <PatientListScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manageQuestions"
          element={
            <ProtectedRoute allowedRoles={["medico", "enfermeiro", "admin"]}>
              <ManageQuestions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medicalChat"
          element={
            <ProtectedRoute allowedRoles={["medico", "paciente", "enfermeiro", "admin"]}>
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
          path="/patienthistory"
          element={
            <ProtectedRoute allowedRoles={["paciente"]}>
              <PatientHistory />
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

        {<Route path="*" element={<NotFound />} />}
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
