import { useEffect, useState } from "react";

const useCrud = (service) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // FETCH
  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await service.getAll();

      // Prisma pagination response
      setData(res.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // CREATE
  const createItem = async (payload) => {
    await service.create(payload);

    fetchData();
  };

  // UPDATE
  const updateItem = async (id, payload) => {
    await service.update(id, payload);

    fetchData();
  };

  // DELETE
  const deleteItem = async (id) => {
    await service.remove(id);

    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,

    fetchData,

    createItem,
    updateItem,
    deleteItem,
  };
};

export default useCrud;