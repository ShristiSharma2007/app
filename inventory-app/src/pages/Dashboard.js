import React, { useEffect, useState } from 'react';
import { Box, Heading, SimpleGrid, Text, Spinner } from '@chakra-ui/react';
import { Pie } from 'react-chartjs-2';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryStats();
  }, []);

  async function fetchInventoryStats() {
    try {
      // Get total inventory value
      const { data: products } = await supabase.from('products').select('*');
      
      const totalValue = products.reduce((sum, product) => {
        return sum + (product.purchase_price * product.quantity);
      }, 0);

      // Get products by category
      const categories = {};
      products.forEach(product => {
        if (categories[product.category]) {
          categories[product.category] += 1;
        } else {
          categories[product.category] = 1;
        }
      });

      // Get low stock products
      const lowStock = products.filter(p => p.quantity < 10);

      setStats({
        totalValue,
        categories,
        lowStock,
        totalProducts: products.length
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <Box p={5}>
      <Heading mb={5}>Dashboard</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
        <Box bg="white" p={5} borderRadius="md" boxShadow="md">
          <Text fontSize="xl" fontWeight="bold">Total Inventory Value</Text>
          <Text fontSize="2xl">€{stats.totalValue.toFixed(2)}</Text>
        </Box>

        <Box bg="white" p={5} borderRadius="md" boxShadow="md">
          <Text fontSize="xl" fontWeight="bold">Total Products</Text>
          <Text fontSize="2xl">{stats.totalProducts}</Text>
        </Box>

        <Box bg="white" p={5} borderRadius="md" boxShadow="md">
          <Text fontSize="xl" fontWeight="bold">Low Stock Items</Text>
          <Text fontSize="2xl">{stats.lowStock.length}</Text>
        </Box>

        <Box bg="white" p={5} borderRadius="md" boxShadow="md">
          <Text fontSize="xl" fontWeight="bold">Products by Category</Text>
          <Pie 
            data={{
              labels: Object.keys(stats.categories),
              datasets: [{
                data: Object.values(stats.categories),
                backgroundColor: [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56',
                  '#4BC0C0',
                  '#9966FF'
                ]
              }]
            }}
          />
        </Box>
      </SimpleGrid>
    </Box>
  );
}