import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, Tooltip, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid, Chip, Switch, FormControlLabel,
    Paper, DialogContentText, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { MaterialReactTable } from 'material-react-table';
import { MRT_Localization_ES } from 'material-react-table/locales/es';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import authFetch from '../../../utils/authFetch';
import { useNotification } from '../../../context/NotificationContext';

const initialLocationState = {
    type: 'particular', name: '', address: '', department: '', city: '', isActive: true
};

const LocationsView = () => {
    const { showNotification } = useNotification();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(initialLocationState);
    const [validationErrors, setValidationErrors] = useState({});
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState(null);

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        try {
            const data = await authFetch('/api/locations');
            setLocations(data || []);
        } catch (err) {
            showNotification(err.message || 'Error al cargar los consultorios.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentLocation(initialLocationState);
        setValidationErrors({});
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (location) => {
        setIsEditing(true);
        setCurrentLocation(location);
        setValidationErrors({});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setCurrentLocation(prev => ({ ...prev, [name]: val }));
    };

    const validateForm = () => {
        const errors = {};
        if (!currentLocation.type) errors.type = 'El tipo es requerido.';
        if (!currentLocation.address.trim()) errors.address = 'La dirección es requerida.';
        if (!currentLocation.city.trim()) errors.city = 'La ciudad es requerida.';
        if (currentLocation.type === 'centro_medico' && !currentLocation.name.trim()) {
            errors.name = 'El nombre del centro es requerido.';
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        
        const url = isEditing ? `/api/locations/${currentLocation.id}` : '/api/locations';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await authFetch(url, { method, body: JSON.stringify(currentLocation) });
            showNotification(`Consultorio ${isEditing ? 'actualizado' : 'creado'} con éxito.`, 'success');
            handleCloseModal();
            fetchLocations();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    const handleDeleteRequest = (location) => {
        setLocationToDelete(location);
        setOpenDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!locationToDelete) return;
        try {
            await authFetch(`/api/locations/${locationToDelete.id}`, { method: 'DELETE' });
            showNotification('Consultorio eliminado con éxito.', 'success');
            fetchLocations();
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            setOpenDeleteConfirm(false);
            setLocationToDelete(null);
        }
    };

    const columns = useMemo(() => [
        { accessorKey: 'name', header: 'Nombre' },
        { accessorKey: 'address', header: 'Dirección' },
        { accessorKey: 'city', header: 'Ciudad' },
        { accessorKey: 'isActive', header: 'Estado', Cell: ({ cell }) => (
            <Chip label={cell.getValue() ? 'Activo' : 'Inactivo'} color={cell.getValue() ? 'success' : 'default'} size="small" />
        )},
    ], []);

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" gutterBottom>Gestión de Consultorios</Typography>
            <MaterialReactTable
                columns={columns}
                data={locations}
                localization={MRT_Localization_ES}
                state={{ isLoading: loading }}
                enableRowActions
                renderRowActions={({ row }) => (
                    <Box sx={{ display: 'flex', gap: '1rem' }}>
                        <Tooltip title="Editar"><IconButton onClick={() => handleOpenEditModal(row.original)}><EditIcon /></IconButton></Tooltip>
                        <Tooltip title="Eliminar"><IconButton color="error" onClick={() => handleDeleteRequest(row.original)}><DeleteIcon /></IconButton></Tooltip>
                    </Box>
                )}
                renderTopToolbarCustomActions={() => (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateModal}>
                        Añadir Consultorio
                    </Button>
                )}
            />

            <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditing ? 'Editar Consultorio' : 'Nuevo Consultorio'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ pt: 1 }} direction="column">
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo</InputLabel>
                                <Select name="type" value={currentLocation.type} label="Tipo" onChange={handleChange}>
                                    <MenuItem value="particular">Consultorio Particular</MenuItem>
                                    <MenuItem value="centro_medico">Centro Médico</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        {currentLocation.type === 'centro_medico' && (
                            <Grid item xs={12}>
                                <TextField name="name" label="Nombre del Centro Médico *" value={currentLocation.name} onChange={handleChange} fullWidth error={!!validationErrors.name} helperText={validationErrors.name} />
                            </Grid>
                        )}
                        <Grid item xs={12}>
                            <TextField name="address" label="Dirección *" value={currentLocation.address} onChange={handleChange} fullWidth error={!!validationErrors.address} helperText={validationErrors.address} />
                        </Grid>
                        <Grid item xs={12}>
                             <TextField name="department" label="Piso / Departamento" value={currentLocation.department} onChange={handleChange} fullWidth />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField name="city" label="Ciudad *" value={currentLocation.city} onChange={handleChange} fullWidth error={!!validationErrors.city} helperText={validationErrors.city} />
                        </Grid>
                        {isEditing && (
                             <Grid item xs={12}>
                                <FormControlLabel control={<Switch name="isActive" checked={currentLocation.isActive} onChange={handleChange} />} label="Consultorio Activo" />
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained">Guardar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro de que desea eliminar el consultorio "{locationToDelete?.name}"? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteConfirm(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} color="error">Eliminar</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default LocationsView;