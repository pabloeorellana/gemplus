import React, { useState, useEffect } from 'react';
import {
    // <-- INICIO DE LA CORRECCIÓN: Se añade 'Grid' a la importación -->
    Container, Typography, Grid, Card, CardActionArea, CardContent,
    CircularProgress, Alert, Box
} from '@mui/material';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import { API_BASE_URL } from '../config';

const SpecialtySelectionStep = ({ onSelectSpecialty }) => {
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSpecialties = async () => {
            setLoading(true);
            setError(null);
            try {
                // <-- CORRECCIÓN: Se construye la URL correctamente usando la variable.
                const response = await fetch(`${API_BASE_URL}/public/specialties`);
                if (!response.ok) {
                    throw new Error("No se pudieron cargar las especialidades disponibles.");
                }
                const data = await response.json();
                setSpecialties(data);
            } catch (err) {
                console.error("Error fetching specialties:", err);
                setError(err.message || "Error al cargar la lista de especialidades. Intente más tarde.");
            } finally {
                setLoading(false);
            }
        };
        fetchSpecialties();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Cargando especialidades...</Typography>
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 2, textAlign: 'center' }}>{error}</Alert>;
    }

    if (specialties.length === 0) {
        return <Alert severity="info" sx={{ m: 2, textAlign: 'center' }}>No hay especialidades disponibles para reservar en este momento.</Alert>;
    }

    return (
        <Container sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
                Seleccione una Especialidad
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Elija el área para la cual necesita un turno.
            </Typography>
            <Grid container spacing={3} justifyContent="center">
                {specialties.map((spec) => (
                    <Grid item key={spec.id} xs={12} sm={6} md={4}>
                        <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.03)' } }}>
                            <CardActionArea onClick={() => onSelectSpecialty(spec.name)} sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
                                <MedicalServicesOutlinedIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                                <CardContent>
                                    <Typography gutterBottom variant="h5" component="h2">{spec.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">{spec.description || 'Haga clic para ver los profesionales disponibles.'}</Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default SpecialtySelectionStep;