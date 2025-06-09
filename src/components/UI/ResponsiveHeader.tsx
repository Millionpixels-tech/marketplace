import { useResponsive } from "../../hooks/useResponsive";
import Header from "./Header";
import MobileHeader from "./MobileHeader";

const ResponsiveHeader = () => {
  const { isMobile } = useResponsive();

  return isMobile ? <MobileHeader /> : <Header />;
};

export default ResponsiveHeader;
