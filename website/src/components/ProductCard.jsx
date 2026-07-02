const ProductCard = ({ product }) => {
  return (
    <div className="border p-3 rounded shadow">
      <h2 className="font-bold">{product.name}</h2>
      <p>Rs {product.price}</p>

      <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded">
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;