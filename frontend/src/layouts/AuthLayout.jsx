import { Outlet, useLocation } from "react-router-dom";
import '../pages/Auth.css';
import loginIllustration from '../assets/image 2.png';
import registerIllustration from '../assets/image 1.png';

export default function AuthLayout({ reverse = false }) {
  const location = useLocation();
  const isRegister = location.pathname === '/register' || reverse;
  const illustration = isRegister ? registerIllustration : loginIllustration;

  return (
    <div className="auth-wrapper">
      <div className={`auth-container ${isRegister ? "reverse-layout" : ""}`}>
        {/* Colorful Sidebar */}
        <div className="auth-sidebar">
          <div className="sidebar-header">
            <div className="logo-wrapper">
              <div className="logo-placeholder">
                <span className="logo-tt">TT</span>
              </div>
              <span className="brand-text">Tunisie Telecom</span>
            </div>
          </div>
          <div className="illustration-wrapper">
            <img src={illustration} alt="Illustration" className="illustration-img" />
          </div>
        </div>

        {/* Content white */}
        <div className="auth-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}