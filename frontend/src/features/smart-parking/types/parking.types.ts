export interface ParkingSpace {
    id: string;
    number: string;
    type: 'regular' | 'accessible' | 'ev' | 'staff' | 'valet';
    status: 'available' | 'occupied' | 'reserved' | 'maintenance';
    floor?: number;
    zone: string;
    guestId?: string;
    vehicleInfo?: {
        make: string;
        model: string;
        color: string;
        plate: string;
    };
    checkInTime?: string;
    checkOutTime?: string;
    duration?: number;
    cost?: number;
}

export interface GuestParking {
    id: string;
    guestId: string;
    guestName: string;
    roomNumber: string;
    vehicleInfo: {
        make: string;
        model: string;
        color: string;
        plate: string;
    };
    spaceId: string;
    spaceNumber: string;
    checkInTime: string; // ISO string
    checkOutTime?: string;
    expectedCheckOut?: string;
    status: 'active' | 'completed' | 'overdue';
    valetStatus?: 'idle' | 'requested' | 'retrieving' | 'ready' | 'delivered';
    valetRequested: boolean;
    cost: number;
    durationInMinutes?: number;
    notes?: string;
}

export interface ParkingFilter {
    searchQuery: string;
    typeFilter: 'all' | ParkingSpace['type'];
    statusFilter: 'all' | ParkingSpace['status'];
}

export interface ParkingAnalytics {
    totalSpaces: number;
    occupiedSpaces: number;
    availableSpaces: number;
    regularSpaces: number;
    staffSpaces: number;
    valetSpaces: number;
    accessibleSpaces: number;
    evSpaces: number;
    occupancyRate: number;
    revenue: {
        today: number;
        thisWeek: number;
        thisMonth: number;
    };
    peakHours: {
        hour: number;
        occupancy: number;
    }[];
}

export interface ParkingSettings {
    pricing: {
        guestHourly: number;
        guestDaily: number;
        valetFee: number;
        evChargingFee: number;
    };
    policies: {
        maxStayHours: number;
        gracePeriodMinutes: number;
        lateFeeRate: number;
        autoCheckoutEnabled: boolean;
    };
    notifications: {
        lowOccupancyAlert: boolean;
        maintenanceReminders: boolean;
    };
    integration: {
        billingSystemEnabled: boolean;
    };
}
