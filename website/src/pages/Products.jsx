import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import API from "../services/api";
import ProductCard from "../components/ProductCard";

const Products = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    API.get("/public/products").then((res) => {
      setProducts(res.data);
    });
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Products</h1>

      <div className="grid grid-cols-3 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </Layout>
  );
};

export default Products;