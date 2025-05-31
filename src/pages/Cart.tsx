const Cart = () => {
  // Simple: keep cart in localStorage or Context API, add logic as needed.
  return (
    <div className="max-w-2xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
      {/* List items here */}
      <button className="bg-black text-white py-2 px-6 rounded mt-4">Checkout</button>
    </div>
  );
};

export default Cart;
