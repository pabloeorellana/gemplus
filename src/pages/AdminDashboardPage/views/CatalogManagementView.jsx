import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Typography, Button, Tooltip, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Tabs, Tab, Paper, DialogContentText,
    FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, Checkbox, ListItemText
} from '@mui/material';
import { MaterialReactTable } from 'material-react-table';
import { MRT_Localization_ES } from 'material-react-table/locales/es';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import authFetch from '../../../utils/authFetch';
import { useNotification } from '../../../context/NotificationContext';

const initialItemState = { name: '', description: '', specialtyIds: [] };

const CatalogManager = ({ catalogName, apiEndpoint, descriptionLabel = "Descripción (Opcional)", isPathology = false }) => {
    const { showNotification } = useNotification();
    const [items, setItems] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState(initialItemState);
    const [validationErrors, setValidationErrors] = useState({});
    const [openDeleteConfirmModal, setOpenDeleteConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const data = await authFetch(apiEndpoint);
            setItems(data || []);
            if (isPathology) {
                const specialtiesData = await authFetch('/api/catalogs/specialties');
                setSpecialties(specialtiesData || []);
            }
        } catch (err) {
            showNotification(`Error al cargar ${catalogName}: ${err.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [apiEndpoint, catalogName, showNotification, isPathology]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleOpenCreateModal = () => {
        setIsEditing(false);
        setCurrentItem(initialItemState);
        setValidationErrors({});
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item) => {
        setIsEditing(true);
        setCurrentItem({ ...item, specialtyIds: item.specialtyIds || [] });
        setValidationErrors({});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const errors = {};
        if (!currentItem.name?.trim()) errors.name = 'El nombre es requerido.';
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        const url = isEditing ? `${apiEndpoint}/${currentItem.id}` : apiEndpoint;
        const method = isEditing ? 'PUT' : 'POST';
        try {
            await authFetch(url, { method, body: JSON.stringify(currentItem) });
            showNotification(`${isEditing ? 'Actualizado' : 'Creado'} con éxito.`, 'success');
            handleCloseModal();
            fetchItems();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };
    
    const handleDeleteRequest = (row) => {
        setItemToDelete(row.original);
        setOpenDeleteConfirmModal(true);
    };

    const handleCloseDeleteConfirmModal = () => {
        setOpenDeleteConfirmModal(false);
        setItemToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await authFetch(`${apiEndpoint}/${itemToDelete.id}`, { method: 'DELETE' });
            showNotification('Eliminado con éxito.', 'success');
            fetchItems();
        } catch (err) {
            showNotification(err.message, 'error');
        } finally {
            handleCloseDeleteConfirmModal();
        }
    };
    
    const columns = useMemo(() => {
        const baseColumns = [
            { accessorKey: 'name', header: 'Nombre' },
        ];

        if (isPathology) {
            baseColumns.push({
                accessorKey: 'specialtyNames',
                header: 'Especialidades',
                Cell: ({ cell }) => {
                    const names = cell.getValue() ? cell.getValue().split(', ') : [];
                    if (names.length === 0) return 'N/A';
                    return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {names.map(name => <Chip key={name} label={name} size="small" />)}
                        </Box>
                    );
                },
            });
        }
        
        if (descriptionLabel) {
            baseColumns.push({ 
                accessorKey: 'description', 
                header: 'Descripción', 
                Cell: ({ cell }) => cell.getValue() || 'N/A' 
            });
        }

        return baseColumns;
    }, [descriptionLabel, isPathology]);

    return (
        <Box>
            <MaterialReactTable
                columns={columns}
                data={items}
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
                        Añadir Nuevo
                    </Button>
                )}
            />
            <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth>
                <DialogTitle>{isEditing ? 'Editar' : 'Crear'} {catalogName}</DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" name="name" label="Nombre *" value={currentItem.name || ''} onChange={handleChange} fullWidth error={!!validationErrors.name} helperText={validationErrors.name} />
                    {descriptionLabel && <TextField margin="dense" name="description" label={descriptionLabel} value={currentItem.description || ''} onChange={handleChange} fullWidth multiline rows={3} />}
                    
                    {isPathology && (
                        <FormControl fullWidth margin="dense">
                            <InputLabel id="specialties-select-label">Especialidades Asociadas</InputLabel>
                            <Select
                                labelId="specialties-select-label"
                                name="specialtyIds"
                                multiple
                                value={currentItem.specialtyIds || []}
                                onChange={handleChange}
                                input={<OutlinedInput label="Especialidades Asociadas" />}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((id) => {
                                            const specialty = specialties.find(s => s.id === id);
                                            return <Chip key={id} label={specialty ? specialty.name : id} />;
                                        })}
                                    </Box>
                                )}
                            >
                                {specialties.map((specialty) => (
                                    <MenuItem key={specialty.id} value={specialty.id}>
                                        <Checkbox checked={(currentItem.specialtyIds || []).indexOf(specialty.id) > -1} />
                                        <ListItemText primary={specialty.name} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained">Guardar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDeleteConfirmModal} onClose={handleCloseDeleteConfirmModal}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro de que desea eliminar "{itemToDelete?.name}"? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteConfirmModal}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} color="error">Eliminar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

const CatalogManagementView = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" gutterBottom>Gestión de Catálogos</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabIndex} onChange={handleTabChange} aria-label="pestañas de catálogos">
                    <Tab label="Especialidades" id="catalog-tab-0" aria-controls="catalog-tabpanel-0" />
                    <Tab label="Patologías" id="catalog-tab-1" aria-controls="catalog-tabpanel-1" />
                    <Tab label="Prefijos" id="catalog-tab-2" aria-controls="catalog-tabpanel-2" /> 
                </Tabs>
            </Box>
            <Box sx={{ pt: 2 }}>
                {tabIndex === 0 && <CatalogManager catalogName="Especialidad" apiEndpoint="/api/catalogs/specialties" />}
                {tabIndex === 1 && <CatalogManager catalogName="Patología" apiEndpoint="/api/catalogs/pathologies" isPathology={true} />}
                {tabIndex === 2 && <CatalogManager catalogName="Prefijo" apiEndpoint="/api/catalogs/prefixes" descriptionLabel={null} />}
            </Box>
        </Paper>
    );
};

export default CatalogManagementView;