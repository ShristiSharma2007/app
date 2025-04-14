import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  FormControl, 
  FormLabel, 
  Input, 
  Select, 
  Switch, 
  Button, 
  useToast,
  Text,
  VStack,
  HStack
} from '@chakra-ui/react';
import { supabase } from '../lib/supabaseClient';

export default function Settings() {
  const [settings, setSettings] = useState({
    companyName: '',
    email: '',
    currency: '€',
    dateFormat: 'DD/MM/YYYY',
    notifications: true,
    lowStockAlert: true,
    lowStockThreshold: 10,
    autoBackup: false,
    backupFrequency: 'daily',
    keepBackups: 7
  });
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .single();
      
      if (data) {
        setSettings(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert([settings], { onConflict: 'id' });
      
      if (error) throw error;
      
      toast({
        title: 'Settings saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  if (loading) return <Box>Loading...</Box>;

  return (
    <Box p={5}>
      <Heading mb={5}>Settings</Heading>
      
      <VStack spacing={5} align="stretch">
        <FormControl>
          <FormLabel>Company Name</FormLabel>
          <Input 
            name="companyName" 
            value={settings.companyName}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input 
            type="email" 
            name="email" 
            value={settings.email}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Default Currency</FormLabel>
          <Select 
            name="currency" 
            value={settings.currency}
            onChange={handleChange}
          >
            <option value="€">Euro (€)</option>
            <option value="$">Dollar ($)</option>
            <option value="£">Pound (£)</option>
            <option value="₹">Rupee (₹)</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Date Format</FormLabel>
          <Select 
            name="dateFormat" 
            value={settings.dateFormat}
            onChange={handleChange}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </Select>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <Switch 
            id="notifications" 
            name="notifications" 
            isChecked={settings.notifications}
            onChange={handleChange}
            mr={3}
          />
          <FormLabel htmlFor="notifications" mb="0">Enable Notifications</FormLabel>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <Switch 
            id="lowStockAlert" 
            name="lowStockAlert" 
            isChecked={settings.lowStockAlert}
            onChange={handleChange}
            mr={3}
          />
          <FormLabel htmlFor="lowStockAlert" mb="0">Low Stock Alerts</FormLabel>
        </FormControl>

        {settings.lowStockAlert && (
          <FormControl>
            <FormLabel>Low Stock Threshold</FormLabel>
            <Input 
              type="number" 
              name="lowStockThreshold" 
              value={settings.lowStockThreshold}
              onChange={handleChange}
            />
          </FormControl>
        )}

        <FormControl display="flex" alignItems="center">
          <Switch 
            id="autoBackup" 
            name="autoBackup" 
            isChecked={settings.autoBackup}
            onChange={handleChange}
            mr={3}
          />
          <FormLabel htmlFor="autoBackup" mb="0">Automatic Backups</FormLabel>
        </FormControl>

        {settings.autoBackup && (
          <>
            <FormControl>
              <FormLabel>Backup Frequency</FormLabel>
              <Select 
                name="backupFrequency" 
                value={settings.backupFrequency}
                onChange={handleChange}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Keep Last X Backups</FormLabel>
              <Input 
                type="number" 
                name="keepBackups" 
                value={settings.keepBackups}
                onChange={handleChange}
              />
            </FormControl>
          </>
        )}

        <HStack spacing={4} mt={5}>
          <Button colorScheme="blue" onClick={handleSave}>Save Settings</Button>
          <Button>Backup Now</Button>
          <Button>Restore Backup</Button>
        </HStack>
      </VStack>
    </Box>
  );
}