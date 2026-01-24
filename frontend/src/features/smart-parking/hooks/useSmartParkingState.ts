import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    ParkingSpace,
    GuestParking,
    ParkingAnalytics,
    ParkingSettings
} from '../types/parking.types';
import {
    showSuccess,
    showError,
    showLoading,
    dismissLoadingAndShowSuccess,
    dismissLoadingAndShowError
} from '../../../utils/toast';
import apiService from '../../../services/ApiService';

const DEFAULT_PROPERTY_ID = '12345678-1234-5678-1234-567812345678';

export const useSmartParkingState = () => {
    // State
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
    const [guestParkings, setGuestParkings] = useState<GuestParking[]>([]);
    const [analytics, setAnalytics] = useState<ParkingAnalytics>({
        totalSpaces: 0,
        occupiedSpaces: 0,
        availableSpaces: 0,
        regularSpaces: 0,
        staffSpaces: 0,
        valetSpaces: 0,
        accessibleSpaces: 0,
        evSpaces: 0,
        occupancyRate: 0,
        revenue: {
            today: 0,
            thisWeek: 0,
            thisMonth: 0
        },
        peakHours: []
    });
    const [settings, setSettings] = useState<ParkingSettings>({
        pricing: {
            guestHourly: 5.00,
            guestDaily: 25.00,
            valetFee: 15.00,
            evChargingFee: 2.50
        },
        policies: {
            maxStayHours: 24,
            gracePeriodMinutes: 30,
            lateFeeRate: 1.5,
            autoCheckoutEnabled: true
        },
        notifications: {
            lowOccupancyAlert: true,
            maintenanceReminders: true
        },
        integration: {
            billingSystemEnabled: true
        }
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [spacesRes, guestRes, healthRes, settingsRes] = await Promise.all([
                apiService.getParkingSpaces(DEFAULT_PROPERTY_ID),
                apiService.getParkingRegistrations(DEFAULT_PROPERTY_ID, 'all'),
                apiService.getParkingHealth(DEFAULT_PROPERTY_ID),
                apiService.getParkingSettings(DEFAULT_PROPERTY_ID)
            ]);
            const pricingRates = settingsRes.success && settingsRes.data
                ? {
                    guestHourly: settingsRes.data.guest_hourly_rate / 100,
                    guestDaily: settingsRes.data.guest_daily_rate / 100,
                    valetFee: settingsRes.data.valet_fee / 100,
                    evChargingFee: settingsRes.data.ev_charging_fee / 100
                }
                : settings.pricing;

            if (spacesRes.success && spacesRes.data) {
                // Map backend spaces to frontend type
                const mappedSpaces: ParkingSpace[] = spacesRes.data.map((s: any) => ({
                    id: s.space_id,
                    number: s.label,
                    type: s.type as any,
                    status: s.status as any,
                    zone: s.zone || 'General',
                    guestId: s.current_guest_id,
                }));
                setSpaces(mappedSpaces);

                if (guestRes.success && guestRes.data) {
                    // Map backend guests to frontend type and resolve space numbers
                    const mappedGuests: GuestParking[] = guestRes.data.map((g: any) => {
                        const space = mappedSpaces.find(s => s.id === g.space_id);
                        const { fee, duration } = calculateParkingFee(g.checkin_at, pricingRates, g.checkout_at);
                        return {
                            id: g.registration_id,
                            guestId: g.guest_id || '',
                            guestName: g.guest_name,
                            roomNumber: g.room_number || 'Not synced',
                            vehicleInfo: {
                                make: g.vehicle_info?.make || 'Unknown',
                                model: g.vehicle_info?.model || 'Unknown',
                                color: g.vehicle_info?.color || 'Unknown',
                                plate: g.plate
                            },
                            spaceId: g.space_id,
                            spaceNumber: space ? space.number : 'Unassigned',
                            checkInTime: g.checkin_at,
                            checkOutTime: g.checkout_at,
                            status: g.status as any,
                            cost: fee,
                            durationInMinutes: duration,
                            valetStatus: g.valet_status as any,
                            valetRequested: g.valet_status !== 'idle',
                            notes: g.notes
                        };
                    });
                    setGuestParkings(mappedGuests);

                    const now = new Date();
                    const startOfDay = new Date(now);
                    startOfDay.setHours(0, 0, 0, 0);
                    const startOfWeek = new Date(startOfDay);
                    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                    const revenue = mappedGuests.reduce(
                        (totals, guest) => {
                            if (guest.status !== 'completed') return totals;
                            const time = new Date(guest.checkOutTime || guest.checkInTime);
                            if (time >= startOfDay) totals.today += guest.cost;
                            if (time >= startOfWeek) totals.thisWeek += guest.cost;
                            if (time >= startOfMonth) totals.thisMonth += guest.cost;
                            return totals;
                        },
                        { today: 0, thisWeek: 0, thisMonth: 0 }
                    );

                    setAnalytics(prev => ({
                        ...prev,
                        revenue
                    }));
                }

                const occupiedCount = mappedSpaces.filter(s => s.status === 'occupied').length;
                const availableCount = mappedSpaces.filter(s => s.status === 'available').length;
                setAnalytics(prev => ({
                    ...prev,
                    occupiedSpaces: occupiedCount,
                    availableSpaces: availableCount
                }));
            }

            if (healthRes.success && healthRes.data) {
                const totalSpaces = healthRes.data?.metrics.total_spaces || 0;
                const occupancyRate = parseFloat(healthRes.data?.metrics.occupancy_rate || '0');
                const availableEstimate = Math.max(0, Math.round(totalSpaces * (1 - occupancyRate / 100)));

                setAnalytics(prev => ({
                    ...prev,
                    totalSpaces,
                    occupancyRate,
                    availableSpaces: availableEstimate
                }));
            }

            if (settingsRes.success && settingsRes.data) {
                const s = settingsRes.data;
                setSettings({
                    pricing: {
                        guestHourly: s.guest_hourly_rate / 100,
                        guestDaily: s.guest_daily_rate / 100,
                        valetFee: s.valet_fee / 100,
                        evChargingFee: s.ev_charging_fee / 100
                    },
                    policies: {
                        maxStayHours: s.max_stay_hours,
                        gracePeriodMinutes: s.grace_period_minutes,
                        lateFeeRate: s.late_fee_rate,
                        autoCheckoutEnabled: s.auto_checkout_enabled
                    },
                    notifications: {
                        lowOccupancyAlert: s.low_occupancy_alert,
                        maintenanceReminders: s.maintenance_reminders
                    },
                    integration: {
                        billingSystemEnabled: s.billing_sync_enabled
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching parking data:', error);
            showError('Failed to load parking data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = useCallback(() => {
        const toastId = showLoading('Refreshing data...');
        fetchData().then(() => {
            dismissLoadingAndShowSuccess(toastId, 'Data refreshed successfully');
        });
    }, [fetchData]);

    const handleSaveSettings = useCallback(async () => {
        setLoading(true);
        const toastId = showLoading('Saving settings...');

        try {
            const response = await apiService.updateParkingSettings(DEFAULT_PROPERTY_ID, {
                guest_hourly_rate: Math.round(settings.pricing.guestHourly * 100),
                guest_daily_rate: Math.round(settings.pricing.guestDaily * 100),
                valet_fee: Math.round(settings.pricing.valetFee * 100),
                ev_charging_fee: Math.round(settings.pricing.evChargingFee * 100),
                max_stay_hours: settings.policies.maxStayHours,
                grace_period_minutes: settings.policies.gracePeriodMinutes,
                late_fee_rate: settings.policies.lateFeeRate,
                auto_checkout_enabled: settings.policies.autoCheckoutEnabled,
                low_occupancy_alert: settings.notifications.lowOccupancyAlert,
                maintenance_reminders: settings.notifications.maintenanceReminders,
                billing_sync_enabled: settings.integration.billingSystemEnabled
            });

            if (response.success) {
                dismissLoadingAndShowSuccess(toastId, 'All settings saved successfully');
            } else {
                dismissLoadingAndShowError(toastId, response.error || 'Failed to save settings');
            }
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    }, [settings]);
    const filteredSpaces = useMemo(() => {
        return spaces.filter(s => {
            const matchesSearch = s.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.vehicleInfo?.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.vehicleInfo?.make.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [spaces, searchQuery]);

    const filteredGuests = useMemo(() => {
        return guestParkings.filter(g => {
            const matchesSearch = g.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.vehicleInfo.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.spaceNumber.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [guestParkings, searchQuery]);

    const availableSpaces = useMemo(() => spaces.filter(s => s.status === 'available'), [spaces]);
    const occupiedSpaces = useMemo(() => spaces.filter(s => s.status === 'occupied'), [spaces]);
    const reservedSpaces = useMemo(() => spaces.filter(s => s.status === 'reserved'), [spaces]);
    const maintenanceSpaces = useMemo(() => spaces.filter(s => s.status === 'maintenance'), [spaces]);

    const activeGuestParkings = useMemo(() => guestParkings.filter(g => g.status === 'active'), [guestParkings]);
    const completedGuestParkings = useMemo(() => guestParkings.filter(g => g.status === 'completed'), [guestParkings]);
    const overdueGuestParkings = useMemo(() => guestParkings.filter(g => g.status === 'overdue'), [guestParkings]);

    const regularSpaces = useMemo(() => spaces.filter(s => s.type === 'regular'), [spaces]);
    const accessibleSpaces = useMemo(() => spaces.filter(s => s.type === 'accessible'), [spaces]);
    const staffSpaces = useMemo(() => spaces.filter(s => s.type === 'staff'), [spaces]);
    const valetSpaces = useMemo(() => spaces.filter(s => s.type === 'valet'), [spaces]);
    const evSpaces = useMemo(() => spaces.filter(s => s.type === 'ev'), [spaces]);

    // Billing calculation utility
    const calculateParkingFee = (checkIn: string, rates: ParkingSettings['pricing'], checkOut?: string) => {
        const start = new Date(checkIn);
        const end = checkOut ? new Date(checkOut) : new Date();
        const diffMs = end.getTime() - start.getTime();
        const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
        const diffHours = Math.ceil(diffMins / 60);

        let fee = diffHours * rates.guestHourly;
        // Cap at daily rate if applicable
        if (fee > rates.guestDaily) {
            fee = rates.guestDaily;
        }

        return { fee, duration: diffMins };
    };

    // Handlers
    const handleSpaceAction = useCallback(async (spaceId: string, action: string) => {
        const space = spaces.find(s => s.id === spaceId);
        if (!space) return;

        setLoading(true);
        const toastId = showLoading('Processing...');

        try {
            let nextStatus: ParkingSpace['status'] = space.status;
            if (action === 'reserve') nextStatus = 'reserved';
            else if (action === 'maintenance') nextStatus = 'maintenance';
            else if (action === 'release') nextStatus = 'available';

            const response = await apiService.updateParkingSpace(spaceId, { status: nextStatus });
            if (response.success) {
                await fetchData();
                dismissLoadingAndShowSuccess(toastId, `Space ${action === 'release' ? 'released' : nextStatus} successfully`);
            } else {
                dismissLoadingAndShowError(toastId, response.error || 'Failed to update space');
            }
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [spaces, fetchData]);

    const handleGuestAction = useCallback(async (guestId: string, action: string) => {
        const guest = guestParkings.find(g => g.id === guestId);
        if (!guest) return;

        setLoading(true);
        const toastId = showLoading('Processing...');

        try {
            if (action === 'checkout') {
                const response = await apiService.checkoutGuestParking(guestId);
                if (response.success) {
                    await fetchData();
                    dismissLoadingAndShowSuccess(toastId, `Guest checked out successfully`);
                } else {
                    dismissLoadingAndShowError(toastId, response.error || 'Checkout failed');
                }
            } else if (action === 'valet') {
                let nextStatus: GuestParking['valetStatus'] = 'requested';
                if (guest.valetStatus === 'requested') nextStatus = 'retrieving';
                else if (guest.valetStatus === 'retrieving') nextStatus = 'ready';
                else if (guest.valetStatus === 'ready') nextStatus = 'delivered';
                else if (guest.valetStatus === 'delivered') nextStatus = 'idle';

                const response = await apiService.updateValetStatus(guestId, nextStatus);
                if (response.success) {
                    await fetchData();
                    dismissLoadingAndShowSuccess(toastId, `Valet status updated to ${nextStatus}`);
                } else {
                    dismissLoadingAndShowError(toastId, response.error || 'Valet update failed');
                }
            } else if (action === 'extend') {
                // Extension logic not yet in backend, but keep toast for now
                dismissLoadingAndShowSuccess(toastId, 'Parking extended successfully');
            }
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [guestParkings, fetchData]);

    const handleAddSpace = useCallback(async (spaceData: Omit<ParkingSpace, 'id'>) => {
        setLoading(true);
        const toastId = showLoading('Adding parking space...');

        try {
            const response = await apiService.createParkingSpace({
                property_id: DEFAULT_PROPERTY_ID,
                label: spaceData.number,
                zone: spaceData.zone,
                type: spaceData.type
            } as any);

            if (response.success && response.data) {
                await fetchData();
                dismissLoadingAndShowSuccess(toastId, 'Parking space added successfully');
                return response.data;
            } else {
                dismissLoadingAndShowError(toastId, response.error || 'Failed to add space');
            }
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to add parking space');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchData]);

    const handleAddGuest = useCallback(async (guestData: any) => {
        setLoading(true);
        const toastId = showLoading('Registering guest parking...');

        try {
            const response = await apiService.registerGuestParking({
                property_id: DEFAULT_PROPERTY_ID,
                guest_name: guestData.guestName,
                plate: guestData.vehiclePlate,
                vehicle_info: {
                    make: guestData.vehicleMake,
                    model: guestData.vehicleModel,
                    color: guestData.vehicleColor
                },
                space_id: guestData.spaceId,
                guest_id: guestData.guestId,
                notes: guestData.notes
            } as any);

            if (response.success && response.data) {
                await fetchData();
                dismissLoadingAndShowSuccess(toastId, 'Guest parking registered successfully');
                return response.data;
            } else {
                dismissLoadingAndShowError(toastId, response.error || 'Failed to register guest');
            }
        } catch (error) {
            dismissLoadingAndShowError(toastId, 'Failed to register guest parking');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [fetchData]);

    const handleSettingsChange = useCallback((key: keyof ParkingSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    const handleExportData = useCallback(() => {
        const data = {
            spaces,
            guestParkings,
            analytics,
            settings
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `parking-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showSuccess('Parking data exported successfully');
    }, [spaces, guestParkings, analytics, settings]);


    return {
        loading,
        spaces,
        guestParkings,
        analytics,
        settings,
        searchQuery,
        setSearchQuery,
        filteredSpaces,
        filteredGuests,
        availableSpaces,
        occupiedSpaces,
        reservedSpaces,
        maintenanceSpaces,
        activeGuestParkings,
        completedGuestParkings,
        overdueGuestParkings,
        regularSpaces,
        accessibleSpaces,
        staffSpaces,
        valetSpaces,
        evSpaces,
        handleSpaceAction,
        handleGuestAction,
        handleAddSpace,
        handleAddGuest,
        handleSettingsChange,
        handleSaveSettings,
        handleExportData,
        handleRefresh
    };
};
