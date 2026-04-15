import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BasicLayout from './layouts/BasicLayout';
import Login from './pages/login/Login';
import LeadList from './pages/leads/LeadList';
import LeadDetail from './pages/leads/LeadDetail';
import LeadAssignRules from './pages/leads/LeadAssignRules';
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import AppointmentList from './pages/appointments/AppointmentList';
import TestDriveList from './pages/test-drive/TestDriveList';
import TrafficList from './pages/traffic/TrafficList';
import TodoCenter from './pages/todo/TodoCenter';
import MessageCenter from './pages/messages/MessageCenter';
import AfterSalesLeads from './pages/after-sales/leads/AfterSalesLeads';
import ServiceAppointmentPage from './pages/after-sales/appointments/ServiceAppointmentPage';
import AccidentList from './pages/after-sales/accidents/AccidentList';
import AfterSalesCustomers from './pages/after-sales/customers/AfterSalesCustomers';

const AppRoutes: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<BasicLayout />}>
        <Route index element={<Navigate to="/leads/list" replace />} />
        <Route path="leads/list" element={<LeadList />} />
        <Route path="leads/detail/:id" element={<LeadDetail />} />
        <Route path="leads/rules" element={<LeadAssignRules />} />
        <Route path="customers/list" element={<CustomerList />} />
        <Route path="customers/detail/:id" element={<CustomerDetail />} />
        <Route path="appointments" element={<AppointmentList />} />
        <Route path="test-drive" element={<TestDriveList />} />
        <Route path="traffic" element={<TrafficList />} />
        <Route path="todo" element={<TodoCenter />} />
        <Route path="messages" element={<MessageCenter />} />
        <Route path="after-sales/leads" element={<AfterSalesLeads />} />
        <Route path="after-sales/appointments" element={<ServiceAppointmentPage />} />
        <Route path="after-sales/accidents" element={<AccidentList />} />
        <Route path="after-sales/customers" element={<AfterSalesCustomers />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
