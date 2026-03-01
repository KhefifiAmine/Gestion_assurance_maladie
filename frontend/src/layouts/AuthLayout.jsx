import { Outlet } from "react-router-dom";
import '../pages/Auth.css';
import tunisieTelecomImg from '../assets/Tunisie_Telecom.jpg';

export default function AuthLayout({ reverse = false }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      width: '100vw',
      backgroundColor: '#f0f2f5'
    }}>
      <div className="auth-container">
        {/* Sidebar gauche */}
        <div className="auth-sidebar">
          <div className="logo-container">
            <div className="logo-circle">
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#00B2FF' }}>TT</span>
            </div>
            <h1 className="brand-name">Tunisie Telecom</h1>
          </div>
          <div className="illustration-container">
            <img src={tunisieTelecomImg} alt="Tunisie Telecom" className="illustration-img" />
          </div>
        </div>

        <div className={`auth-content ${reverse ? "order-1" : "order-2"}`}>
            <Outlet />
        </div>
      </div>
    </div>
)}