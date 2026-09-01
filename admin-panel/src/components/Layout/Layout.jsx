import React from "react";
import Menus from "./Menus";
import Footer from "./Footer";

const Layout = ({ children }) => {
  return (
    <div className="container-fluid m-0 p-0">
      <div className="row g-0">
        {/* Left Dark Sidebar */}
        <div className="col-md-2 bg-dark text-light min-vh-100 p-3">
          {/* Upar wala Admin panel yahan se hata diya hai */}
          <Menus />
        </div>

        {/* Right Main Content */}
        <div className="col-md-10 p-4">
          <div className="content">{children}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;