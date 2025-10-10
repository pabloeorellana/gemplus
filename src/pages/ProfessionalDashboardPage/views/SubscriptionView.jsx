import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, Grid, Card, CardContent, CardHeader,
    List, ListItem, ListItemIcon, ListItemText, CircularProgress, Alert,
    Divider, Chip, Stack
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import XCircleIcon from '@mui/icons-material/Cancel';
import authFetch from '../../../utils/authFetch';
import { useNotification } from '../../../context/NotificationContext';
import { DateTime } from 'luxon';
import { useLocation, useNavigate } from 'react-router-dom';

const SubscriptionView = () => {
    const { showNotification } = useNotification();
    const [plans, setPlans] = useState([]);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRedirecting, setIsRedirecting] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // ✅ Cargar planes y estado actual
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [plansData, statusData] = await Promise.all([
                authFetch('/api/subscriptions/plans'),
                authFetch('/api/subscriptions/my-status').catch(() => null)
            ]);
            setPlans(plansData || []);
            setCurrentSubscription(statusData);
        } catch (err) {
            setError(err.message || 'Error al cargar los datos de suscripción.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ✅ Detectar retorno desde Mercado Pago y refrescar datos
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const status = params.get('status');

        if (status) {
            switch (status) {
                case 'success':
                    showNotification('¡Suscripción activada con éxito!', 'success');
                    fetchData(); // 🔄 Actualizar estado de suscripción automáticamente
                    break;
                case 'failure':
                    showNotification('El pago fue rechazado o cancelado.', 'error');
                    break;
                case 'pending':
                    showNotification('El pago está pendiente de aprobación.', 'info');
                    break;
                default:
                    break;
            }
            // 🔹 Limpia el parámetro de la URL (para que no repita el mensaje)
            navigate('/profesional/dashboard/suscripcion', { replace: true });
        }
    }, [location.search, showNotification, fetchData, navigate]);

    // ✅ Redirigir al checkout de Mercado Pago
    const handleSubscribe = async (planId) => {
        setIsRedirecting(planId);
        try {
            const response = await authFetch('/api/subscriptions/create', {
                method: 'POST',
                body: JSON.stringify({ planId }),
            });

            if (response.init_point) {
                showNotification('Redirigiendo a Mercado Pago...', 'info');
                window.location.href = response.init_point;
            } else {
                throw new Error(response.message || 'No se pudo obtener el enlace de suscripción.');
            }
        } catch (err) {
            showNotification(err.message || 'Error al iniciar la suscripción.', 'error');
            setIsRedirecting(null);
        }
    };

    const statusColors = {
        active: { label: 'Activa', color: 'success' },
        trial: { label: 'En Prueba', color: 'info' },
        paused: { label: 'Pausada', color: 'warning' },
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h5" gutterBottom align="center" sx={{ mb: 2 }}>
                Mi Suscripción
            </Typography>

            {/* Estado actual */}
            {currentSubscription ? (
                <Card variant="outlined" sx={{ mb: 4, bgcolor: 'primary.lighter' }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="h6">
                                    Plan Actual: {currentSubscription.planName}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Tu suscripción vence el:{' '}
                                    {DateTime.fromISO(currentSubscription.currentPeriodEnd)
                                        .setLocale('es')
                                        .toFormat("dd 'de' LLLL, yyyy")}
                                </Typography>
                            </Box>
                            <Chip
                                label={
                                    statusColors[
                                        currentSubscription.type === 'trial'
                                            ? 'trial'
                                            : currentSubscription.status
                                    ]?.label || 'Desconocido'
                                }
                                color={
                                    statusColors[
                                        currentSubscription.type === 'trial'
                                            ? 'trial'
                                            : currentSubscription.status
                                    ]?.color || 'default'
                                }
                            />
                        </Stack>
                    </CardContent>
                </Card>
            ) : (
                <Alert severity="warning" sx={{ mb: 4 }}>
                    No tienes una suscripción activa. Tu cuenta puede tener funcionalidades
                    limitadas o ser desactivada.
                </Alert>
            )}

            <Divider sx={{ my: 4 }}>
                <Typography variant="overline">Cambiar de Plan</Typography>
            </Divider>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Listado de planes */}
            <Grid container spacing={4} justifyContent="center" alignItems="stretch">
                {plans.map((plan) => (
                    <Grid item key={plan.id} xs={12} md={6}>
                        <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <CardHeader
                                title={plan.name}
                                titleTypographyProps={{ align: 'center', variant: 'h5' }}
                                sx={{ backgroundColor: 'grey.200' }}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'baseline',
                                        mb: 2,
                                    }}
                                >
                                    <Typography component="h2" variant="h3" color="text.primary">
                                        ${new Intl.NumberFormat('es-AR').format(plan.price)}
                                    </Typography>
                                    <Typography variant="h6" color="text.secondary">
                                        /mes
                                    </Typography>
                                </Box>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckCircleIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`${
                                                plan.patientLimit === -1
                                                    ? 'Ilimitados'
                                                    : `Hasta ${plan.patientLimit}`
                                            } pacientes`}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckCircleIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`${
                                                plan.locationLimit === -1
                                                    ? 'Ilimitados'
                                                    : `Hasta ${plan.locationLimit}`
                                            } consultorios`}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CheckCircleIcon color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={`${plan.storageLimitGB} GB de almacenamiento`}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            {plan.hasEmailFeatures ? (
                                                <CheckCircleIcon color="primary" />
                                            ) : (
                                                <XCircleIcon color="disabled" />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Recordatorios y Agenda Diaria por Email"
                                            sx={{
                                                color: !plan.hasEmailFeatures
                                                    ? 'text.disabled'
                                                    : 'text.primary',
                                            }}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                            <Box sx={{ p: 2 }}>
                                <Button
                                    fullWidth
                                    variant={
                                        currentSubscription?.planName === plan.name
                                            ? 'outlined'
                                            : 'contained'
                                    }
                                    color={
                                        currentSubscription?.planName === plan.name
                                            ? 'inherit'
                                            : 'primary'
                                    }
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={isRedirecting !== null}
                                    startIcon={
                                        isRedirecting === plan.id ? (
                                            <CircularProgress size={20} />
                                        ) : null
                                    }
                                >
                                    {currentSubscription?.planName === plan.name
                                        ? 'Plan Actual'
                                        : isRedirecting === plan.id
                                        ? 'Redirigiendo...'
                                        : 'Suscribirse'}
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

export default SubscriptionView;
