import { Outlet } from "react-router-dom";
import { Header } from "../components";
import BottomNav from "./BottomNav";

const MainLayout = () => {
  return (
    <>
      <Header />
      {/* Bottom padding keeps content clear of the fixed tab bar on phones */}
      <div className="flex flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
};

export default MainLayout;
