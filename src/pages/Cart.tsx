import { Button, Card } from "../components/UI";
import Header from "../components/UI/Header";
import Footer from "../components/UI/Footer";

const Cart = () => {
  // Simple: keep cart in localStorage or Context API, add logic as needed.
  return (
    <>
      <Header />
      <div className="max-w-2xl mx-auto py-12 min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
        <Card className="p-6">
          <p className="text-[#454955] mb-4">Your cart is empty</p>
          {/* List items here */}
          <Button className="mt-4">
            Checkout
          </Button>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default Cart;
