import { DriverData } from './types';

/**
 * Simulates the Geotab API for preview purposes.
 */
export const mockGeotabApi = {
  call: async (method: string, params: any): Promise<any[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const selectedGroupIds = params.search?.groups?.map((g: any) => g.id) || 
                             params.search?.deviceSearch?.groups?.map((g: any) => g.id) || 
                             null;

    if (params.typeName === 'User') {
      const users = [
        { id: 'u1', firstName: 'John', lastName: 'Doe', name: 'john.doe@example.com', companyGroups: [{ id: 'g1' }] },
        { id: 'u2', firstName: 'Jane', lastName: 'Smith', name: 'jane.smith@example.com', companyGroups: [{ id: 'g1' }] },
        { id: 'u3', firstName: 'Bob', lastName: 'Johnson', name: 'bob.j@example.com', companyGroups: [{ id: 'g2' }] },
        { id: 'u4', firstName: 'Alice', lastName: 'Williams', name: 'alice.w@example.com', companyGroups: [{ id: 'g2' }] },
      ];
      return selectedGroupIds 
        ? users.filter(u => u.companyGroups.some(g => selectedGroupIds.includes(g.id)))
        : users;
    }

    if (params.typeName === 'Group') {
      return [
        { id: 'g1', name: 'East Coast Fleet' },
        { id: 'g2', name: 'West Coast Fleet' },
      ];
    }

    if (params.typeName === 'Device') {
      const devices = [
        { id: 'v1', name: 'Truck 101', groups: [{ id: 'g1' }] },
        { id: 'v2', name: 'Truck 102', groups: [{ id: 'g1' }] },
        { id: 'v3', name: 'Van 201', groups: [{ id: 'g2' }] },
        { id: 'v4', name: 'Van 202', groups: [{ id: 'g2' }] },
      ];
      return selectedGroupIds 
        ? devices.filter(d => d.groups.some(g => selectedGroupIds.includes(g.id)))
        : devices;
    }

    if (params.typeName === 'Trip') {
      const trips = [];
      const drivers = selectedGroupIds?.includes('g1') ? ['u1', 'u2'] : 
                      selectedGroupIds?.includes('g2') ? ['u3', 'u4'] : 
                      ['u1', 'u2', 'u3', 'u4'];
      const devices = selectedGroupIds?.includes('g1') ? ['v1', 'v2'] : 
                      selectedGroupIds?.includes('g2') ? ['v3', 'v4'] : 
                      ['v1', 'v2', 'v3', 'v4'];
      
      for (let i = 0; i < 15; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 7));
        trips.push({
          driver: { id: drivers[Math.floor(Math.random() * drivers.length)] },
          device: { id: devices[Math.floor(Math.random() * devices.length)] },
          start: date.toISOString(),
          distance: Math.random() * 50000 + 10000
        });
      }
      return trips;
    }

    if (params.typeName === 'DVIRLog') {
      const logs = [];
      const drivers = selectedGroupIds?.includes('g1') ? ['u1', 'u2'] : 
                      selectedGroupIds?.includes('g2') ? ['u3', 'u4'] : 
                      ['u1', 'u2', 'u3', 'u4'];
      
      for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 7));
        logs.push({
          driver: { id: drivers[Math.floor(Math.random() * drivers.length)] },
          dateTime: date.toISOString()
        });
      }
      return logs;
    }

    return [];
  }
};
