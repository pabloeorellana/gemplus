import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Chip, Tooltip, IconButton, Menu, MenuItem } from '@mui/material';
import { MaterialReactTable } from 'material-react-table';
import { MRT_Localization_ES } from 'material-react-table/locales/es';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import authFetch from '../../../utils/authFetch';
import { useNotification } from '../../../context/NotificationContext';

const statusColors = {
    active: 'success',
    expired: 'error',
    cancelled: 'default',
    paused: 'info',
};

const typeLabels = {
    trial: 'Prueba',
    mercado_pago: 'Mercado Pago',
    manual: 'Manual',
};

const SubscriptionManagementView = () => {
    const { showNotification } = useNotification();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const open = Boolean(anchorEl);

    const fetchSubscriptions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await authFetch('/api/admin/subscriptions');
            setSubscriptions(data || []);
        } catch (err) {
            showNotification(err.message || 'Error al cargar las suscripciones.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchSubscriptions();
    }, [fetchSubscriptions]);

    const handleMenuClick = (event, subscription) => {
        setAnchorEl(event.currentTarget);
        setSelectedSubscription(subscription);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedSubscription(null);
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedSubscription) return;
        handleMenuClose();
        try {
            await authFetch(`/api/admin/subscriptions/${selectedSubscription.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            showNotification('Estado de la suscripción actualizado.', 'success');
            fetchSubscriptions();
        } catch (err) {
            showNotification(err.message || 'Error al actualizar el estado.', 'error');
        }
    };

    const columns = useMemo(() => [
        { accessorKey: 'userName', header: 'Usuario' },
        { accessorKey: 'userEmail', header: 'Email' },
        { accessorKey: 'planName', header: 'Plan' },
        { 
            accessorKey: 'status', 
            header: 'Estado',
            Cell: ({ cell }) => (
                <Chip 
                    label={cell.getValue()?.charAt(0).toUpperCase() + cell.getValue()?.slice(1)} 
                    color={statusColors[cell.getValue()] || 'default'} 
                    size="small" 
                />
            )
        },
        { 
            accessorKey: 'type', 
            header: 'Tipo',
            Cell: ({ cell }) => typeLabels[cell.getValue()] || cell.getValue()
        },
        { 
            accessorKey: 'currentPeriodEnd', 
            header: 'Vence el',
            Cell: ({ cell }) => format(parseISO(cell.getValue()), 'dd/MM/yyyy HH:mm', { locale: es })
        },
    ], []);

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" gutterBottom>
                Gestión de Suscripciones
            </Typography>
            <MaterialReactTable
                columns={columns}
                data={subscriptions}
                localization={MRT_Localization_ES}
                state={{ isLoading: loading }}
                muiTablePaperProps={{ elevation: 0 }}
                enableRowActions
                renderRowActions={({ row }) => (
                    <Box>
                        <Tooltip title="Acciones">
                            <IconButton onClick={(e) => handleMenuClick(e, row.original)}>
                                <MoreVertIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
                enableColumnFilters={false}
                enableGlobalFilter
                initialState={{ showGlobalFilter: true }}
                muiSearchTextFieldProps={{
                    placeholder: 'Buscar suscripciones...',
                    sx: { m: '0.5rem 0', width: '100%' },
                    variant: 'outlined',
                    size: 'small',
                }}
                positionGlobalFilter="left"
            />
            <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
                <MenuItem onClick={() => handleUpdateStatus('active')} disabled={selectedSubscription?.status === 'active'}>Reactivar</MenuItem>
                <MenuItem onClick={() => handleUpdateStatus('paused')}>Pausar</MenuItem>
                <MenuItem onClick={() => handleUpdateStatus('cancelled')} sx={{ color: 'error.main' }}>Cancelar</MenuItem>
            </Menu>
        </Paper>
    );
};

export default SubscriptionManagementView;