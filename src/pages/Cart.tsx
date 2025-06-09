import { Button, Card } from "../components/UI";
import ResponsiveHeader from "../components/UI/ResponsiveHeader";
import Footer from "../components/UI/Footer";
import { SEOHead } from "../components/SEO/SEOHead";
import { getCanonicalUrl, generateKeywords } from "../utils/seo";
import { useResponsive } from "../hooks/useResponsive";

const Cart = () => {
  const { isMobile } = useResponsive();
  // Simple: keep cart in localStorage or Context API, add logic as needed.
  return (
    <>
      <SEOHead
        title="Shopping Cart - Sri Lankan Marketplace"
        description="Review your selected authentic Sri Lankan products before checkout. Secure shopping experience with multiple payment options."
        keywords={generateKeywords(['shopping cart', 'checkout', 'purchase', 'buy Sri Lankan products'])}
        canonicalUrl={getCanonicalUrl('/cart')}
        noIndex={true}
      />
      <ResponsiveHeader />
      <div className={`${isMobile ? 'max-w-sm px-4 py-8' : 'max-w-2xl py-12'} mx-auto min-h-screen`}>
        <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-4`}>Your Cart</h2>
        <Card className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <p className={`text-[#454955] ${isMobile ? 'mb-3 text-sm' : 'mb-4'}`}>Your cart is empty</p>
          {/* List items here */}
          <Button className={`${isMobile ? 'mt-3 text-sm' : 'mt-4'}`}>
            Checkout
          </Button>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default Cart;
