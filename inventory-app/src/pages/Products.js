import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useDisclosure,
  useToast,
  Spinner
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';
import Papa from 'papaparse';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*');
    
    if (error) {
      toast({
        title: 'Error loading products',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      setProducts(data);
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productData = Object.fromEntries(formData.entries());

    try {
      if (currentProduct) {
        // Update product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', currentProduct.id);
        
        if (error) throw error;
        toast({
          title: 'Product updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Add new product
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        
        if (error) throw error;
        toast({
          title: 'Product added',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      fetchProducts();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

  async function handleDelete(id) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: 'Product deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchProducts();
    } catch (error) {
      toast({
        title: 'Error deleting product',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

  function handleEdit(product) {
    setCurrentProduct(product);
    onOpen();
  }

  function handleAdd() {
    setCurrentProduct(null);
    onOpen();
  }

  function handleCSVImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    setCsvFile(file);
    
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const { error } = await supabase
            .from('products')
            .upsert(results.data, { onConflict: 'product_code' });
          
          if (error) throw error;
          
          toast({
            title: 'CSV Imported',
            description: `${results.data.length} products imported successfully`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          
          fetchProducts();
        } catch (error) {
          toast({
            title: 'Error importing CSV',
            description: error.message,
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }
    });
  }

  function handleExportCSV() {
    const headers = [
      'product_name', 'product_code', 'category', 'quantity', 
      'purchase_price', 'selling_price', 'supplier', 'warehouse',
      'entry_date', 'expiry_date', 'notes', 'currency'
    ];
    
    const csvContent = [
      headers.join(','),
      ...products.map(p => headers.map(h => `"${p[h]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'products_export.csv');
    link.click();
  }

  return (
    <Box p={5}>
      <Box display="flex" justifyContent="space-between" mb={5}>
        <Button colorScheme="blue" onClick={handleAdd}>Add Product</Button>
        <Box>
          <Button mr={2} onClick={handleExportCSV}>Export CSV</Button>
          <Button as="label" htmlFor="csv-upload" colorScheme="green">
            Import CSV
            <Input 
              id="csv-upload" 
              type="file" 
              accept=".csv" 
              onChange={handleCSVImport}
              display="none"
            />
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Spinner />
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Code</Th>
              <Th>Category</Th>
              <Th>Quantity</Th>
              <Th>Price</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {products.map(product => (
              <Tr key={product.id}>
                <Td>{product.product_name}</Td>
                <Td>{product.product_code}</Td>
                <Td>{product.category}</Td>
                <Td>{product.quantity}</Td>
                <Td>{product.currency}{product.selling_price}</Td>
                <Td>
                  <Button 
                    size="sm" 
                    colorScheme="yellow" 
                    mr={2}
                    onClick={() => handleEdit(product)}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    colorScheme="red"
                    onClick={() => handleDelete(product.id)}
                  >
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit}>
          <ModalHeader>{currentProduct ? 'Edit Product' : 'Add Product'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={4} isRequired>
              <FormLabel>Product Name</FormLabel>
              <Input 
                name="product_name" 
                defaultValue={currentProduct?.product_name || ''}
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Product Code</FormLabel>
              <Input 
                name="product_code" 
                defaultValue={currentProduct?.product_code || ''}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Category</FormLabel>
              <Input 
                name="category" 
                defaultValue={currentProduct?.category || ''}
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Quantity</FormLabel>
              <Input 
                type="number" 
                name="quantity" 
                defaultValue={currentProduct?.quantity || 0}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Purchase Price</FormLabel>
              <Input 
                type="number" 
                step="0.01"
                name="purchase_price" 
                defaultValue={currentProduct?.purchase_price || 0}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Selling Price</FormLabel>
              <Input 
                type="number" 
                step="0.01"
                name="selling_price" 
                defaultValue={currentProduct?.selling_price || 0}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Supplier</FormLabel>
              <Input 
                name="supplier" 
                defaultValue={currentProduct?.supplier || ''}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Warehouse</FormLabel>
              <Input 
                name="warehouse" 
                defaultValue={currentProduct?.warehouse || ''}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Entry Date</FormLabel>
              <Input 
                type="date" 
                name="entry_date" 
                defaultValue={currentProduct?.entry_date || ''}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Expiry Date</FormLabel>
              <Input 
                type="date" 
                name="expiry_date" 
                defaultValue={currentProduct?.expiry_date || ''}
              />
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Currency</FormLabel>
              <Select 
                name="currency" 
                defaultValue={currentProduct?.currency || '€'}
              >
                <option value="€">Euro (€)</option>
                <option value="$">Dollar ($)</option>
                <option value="£">Pound (£)</option>
                <option value="₹">Rupee (₹)</option>
              </Select>
            </FormControl>

            <FormControl mb={4}>
              <FormLabel>Notes</FormLabel>
              <Textarea 
                name="notes" 
                defaultValue={currentProduct?.notes || ''}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button type="submit" colorScheme="blue" mr={3}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}