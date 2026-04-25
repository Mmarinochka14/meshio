import { Outlet } from "react-router-dom";
import AdminHeader from "../../components/AdminHeader";
import "../../styles/admin.css";

export default function AdminLayout() {
  return (
    <>
      <AdminHeader />

      <div className="admin">
        <div className="admin__content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
