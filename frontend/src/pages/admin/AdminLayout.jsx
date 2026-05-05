import { Outlet } from "react-router-dom";
import Header from "../../components/Header";
import "../../styles/admin.css";

export default function AdminLayout() {
  return (
    <>
      <Header />

      <div className="admin">
        <div className="admin__content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
