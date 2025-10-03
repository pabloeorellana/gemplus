import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, Box, CssBaseline, AppBar, Toolbar, Alert, TextField,
    Button, CircularProgress, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
    Card, CardContent, CardActions, Avatar, CardActionArea
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import SpecialtySelectionStep from '../../components/SpecialtySelectionStep.jsx';
import ProfessionalSelectionStep from '../../components/ProfessionalSelectionStep/ProfessionalSelectionStep.jsx';
import AvailabilityCalendar from '../../components/AvailabilityCalendar/AvailabilityCalendar.jsx';
import PatientForm from '../../components/PatientForm/PatientForm.jsx';
import AppointmentConfirmation from '../../components/AppointmentConfirmation/AppointmentConfirmation.jsx';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import logoGEM from '/gemplus-logo.png';

const getInitials = (name) => {
    if (!name) return '?';
    const nameParts = name.trim().split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    if (nameParts[0]) {
         return name.substring(0, 2).toUpperCase();
    }
    return '?';
};

const STEPS = {
    SPECIALTY_SELECTION: 'SPECIALTY_SELECTION',
    PROFESSIONAL_SELECTION: 'PROFESSIONAL_SELECTION',
    LOCATION_SELECTION: 'LOCATION_SELECTION',
    CALENDAR_SELECTION: 'CALENDAR_SELECTION',
    PATIENT_FORM: 'PATIENT_FORM',
    CONFIRMATION: 'CONFIRMATION',
};

const AnimatedStep = ({ children }) => (
    <Box
        sx={{
            animation: 'fadeInSlideUp 0.5s ease-out forwards',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}
    >
        {children}
    </Box>
);

const AppointmentBookingPage = () => {
    const { professionalId: paramProfessionalId } = useParams();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(STEPS.SPECIALTY_SELECTION);
    const [welcomeModalOpen, setWelcomeModalOpen] = useState(true);
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [professionals, setProfessionals] = useState([]);
    const [loadingProfessionals, setLoadingProfessionals] = useState(false);
    const [errorProfessionals, setErrorProfessionals] = useState('');
    const [selectedProfessionalId, setSelectedProfessionalId] = useState(null);
    const [selectedProfessionalName, setSelectedProfessionalName] = useState('');
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [errorLocations, setErrorLocations] = useState('');
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const [selectedLocationName, setSelectedLocationName] = useState('');
    const [selectedDateTime, setSelectedDateTime] = useState(null);
    const [confirmedAppointment, setConfirmedAppointment] = useState(null);
    const [dniInput, setDniInput] = useState('');
    const [recognizedPatient, setRecognizedPatient] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState('');
    const [dniLookupPerformed, setDniLookupPerformed] = useState(false);
    const [submissionError, setSubmissionError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchDirectProfessionalData = async () => {
            if (paramProfessionalId) {
                setWelcomeModalOpen(false);
                setLoadingProfessionals(true);
                try {
                    const professionalsResponse = await fetch(`${API_BASE_URL}/public/professionals`);
                    const professionalsData = await professionalsResponse.json();
                    const prof = professionalsData.find(p => p.id === paramProfessionalId);

                    if (prof) {
                        setSelectedProfessionalId(prof.id);
                        setSelectedProfessionalName(prof.fullName);
                        setSelectedSpecialty(prof.specialty);

                        const locationsResponse = await fetch(`${API_BASE_URL}/public/professionals/${prof.id}/locations`);
                        const locationsData = await locationsResponse.json();
                        
                        setLocations(locationsData);

                        if (locationsData.length === 0) {
                             setErrorProfessionals('Este profesional no tiene consultorios configurados.');
                             setCurrentStep(STEPS.SPECIALTY_SELECTION);
                        } else if (locationsData.length === 1) {
                            setSelectedLocationId(locationsData[0].id);
                            setSelectedLocationName(locationsData[0].name);
                            setCurrentStep(STEPS.CALENDAR_SELECTION);
                        } else {
                            setCurrentStep(STEPS.LOCATION_SELECTION);
                        }
                    } else {
                        setErrorProfessionals('El profesional especificado en la URL no es válido.');
                        setCurrentStep(STEPS.SPECIALTY_SELECTION);
                    }
                } catch (err) {
                    setErrorProfessionals('No se pudo verificar el profesional o sus consultorios.');
                    setCurrentStep(STEPS.SPECIALTY_SELECTION);
                } finally {
                    setLoadingProfessionals(false);
                }
            }
        };
        fetchDirectProfessionalData();
    }, [paramProfessionalId]);


    const handleDniLookup = async () => {
        if (!dniInput.trim()) {
            setLookupError("Por favor, ingrese un DNI válido para buscar.");
            return;
        }
        setLookupLoading(true);
        setLookupError('');
        setRecognizedPatient(null);
        setDniLookupPerformed(true);

        try {
            const response = await fetch(`${API_BASE_URL}/public/patients/lookup?dni=${dniInput.trim()}`);
            if (response.status === 404) {
                setRecognizedPatient({ dni: dniInput.trim() });
                throw new Error("DNI no encontrado. Puede continuar y completar sus datos.");
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Error del servidor al buscar el DNI.");
            }
            const patientData = await response.json();
            setRecognizedPatient(patientData);
        } catch (error) {
            setLookupError(error.message);
            if (!recognizedPatient) {
                setRecognizedPatient({ dni: dniInput.trim() });
            }
        } finally {
            setLookupLoading(false);
        }
    };
    
    const handleCloseWelcomeModal = () => {
        if (dniLookupPerformed || !dniInput.trim()) {
            setWelcomeModalOpen(false);
        } else {
            setLookupError("Por favor, presione 'Buscar' para validar su DNI antes de continuar.");
        }
    };
    
    const handleSelectSpecialty = useCallback(async (specialtyName) => {
        setSelectedSpecialty(specialtyName);
        setLoadingProfessionals(true);
        setErrorProfessionals('');
        try {
            const response = await fetch(`${API_BASE_URL}/public/professionals?specialty=${encodeURIComponent(specialtyName)}`);
            if (!response.ok) {
                throw new Error('Error al cargar profesionales para esta especialidad.');
            }
            const data = await response.json();
            setProfessionals(data);
            setCurrentStep(STEPS.PROFESSIONAL_SELECTION);
        } catch (err) {
            setErrorProfessionals(err.message);
        } finally {
            setLoadingProfessionals(false);
        }
    }, []);

    const handleSelectProfessional = useCallback(async (profId, profName) => {
        setSelectedProfessionalId(profId);
        setSelectedProfessionalName(profName);
        setLoadingLocations(true);
        setErrorLocations('');
        try {
            const response = await fetch(`${API_BASE_URL}/public/professionals/${profId}/locations`);
            if (!response.ok) {
                throw new Error('Error al cargar los consultorios de este profesional.');
            }
            const data = await response.json();
            
            setLocations(data);

            if (data.length === 0) {
                setErrorLocations('Este profesional no tiene consultorios activos para la reserva online.');
            } else if (data.length === 1) {
                setSelectedLocationId(data[0].id);
                setSelectedLocationName(data[0].name);
                setCurrentStep(STEPS.CALENDAR_SELECTION);
            } else {
                setCurrentStep(STEPS.LOCATION_SELECTION);
            }
        } catch (err) {
            setErrorLocations(err.message);
        } finally {
            setLoadingLocations(false);
        }
    }, []);

    const handleSelectLocation = (location) => {
        setSelectedLocationId(location.id);
        setSelectedLocationName(location.name);
        setCurrentStep(STEPS.CALENDAR_SELECTION);
    };

    const handleSlotSelected = (dateTime) => {
        setSelectedDateTime(dateTime);
        setCurrentStep(STEPS.PATIENT_FORM);
    };

    const handleFormSubmit = async (patientDetails, appointmentDateTime) => {
        setIsSubmitting(true);
        setSubmissionError('');
        try {
            const payload = {
                professionalUserId: selectedProfessionalId,
                locationId: selectedLocationId,
                dateTime: appointmentDateTime.toISOString(),
                dni: patientDetails.dni,
                firstName: patientDetails.firstName,
                lastName: patientDetails.lastName,
                email: patientDetails.email,
                phone: patientDetails.phone,
                reasonForVisit: patientDetails.reasonForVisit
            };
            
            const response = await fetch(`${API_BASE_URL}/public/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "No se pudo confirmar el turno.");
            }

            const locationDetails = locations.find(loc => loc.id === selectedLocationId);

            setConfirmedAppointment({
                patient: patientDetails,
                dateTime: appointmentDateTime,
                professionalName: selectedProfessionalName,
                location: locationDetails,
                appointmentDetails: data
            });
            setCurrentStep(STEPS.CONFIRMATION);
        } catch (error) {
            console.error("Error al confirmar el turno:", error);
            setSubmissionError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelForm = () => {
        if (paramProfessionalId) {
            if (currentStep === STEPS.PATIENT_FORM) {
                setCurrentStep(STEPS.CALENDAR_SELECTION);
            }
            return;
        }

        switch(currentStep) {
            case STEPS.PROFESSIONAL_SELECTION:
                setCurrentStep(STEPS.SPECIALTY_SELECTION);
                setSelectedSpecialty('');
                setProfessionals([]);
                break;
            case STEPS.LOCATION_SELECTION:
                setCurrentStep(STEPS.PROFESSIONAL_SELECTION);
                setSelectedProfessionalId(null);
                setSelectedProfessionalName('');
                setLocations([]);
                break;
            case STEPS.CALENDAR_SELECTION:
                if (locations.length > 1) {
                    setCurrentStep(STEPS.LOCATION_SELECTION);
                    setSelectedLocationId(null);
                } else {
                    setCurrentStep(STEPS.PROFESSIONAL_SELECTION);
                    setSelectedProfessionalId(null);
                    setSelectedProfessionalName('');
                }
                break;
            case STEPS.PATIENT_FORM:
                setCurrentStep(STEPS.CALENDAR_SELECTION);
                break;
            default:
                break;
        }
    };

    const handleBookAnother = () => {
        setCurrentStep(STEPS.SPECIALTY_SELECTION);
        setWelcomeModalOpen(true);
        setSelectedSpecialty('');
        setProfessionals([]);
        setSelectedProfessionalId(null);
        setSelectedProfessionalName('');
        setLocations([]);
        setSelectedLocationId(null);
        setSelectedLocationName('');
        setSelectedDateTime(null);
        setConfirmedAppointment(null);
        setDniInput('');
        setRecognizedPatient(null);
        setLookupError('');
        setDniLookupPerformed(false);
        setSubmissionError('');
        setIsSubmitting(false);
        if (paramProfessionalId) navigate('/reservar-turno');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.100' }}>
            <CssBaseline />
            <AppBar position="static" color="primary">
                <Toolbar>
                    <Box component="img" src="/gemplus-logo.png" sx={{ height: '36px', mr: 2 }} />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Solicitud de turnos
                    </Typography>
                </Toolbar>
            </AppBar>
            <Dialog 
                open={welcomeModalOpen && !paramProfessionalId} 
                onClose={(event, reason) => {
                    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                        handleCloseWelcomeModal();
                    }
                }}
                disableEscapeKeyDown
                aria-labelledby="welcome-dialog-title" 
                maxWidth="sm" 
                fullWidth
            >
                <DialogTitle id="welcome-dialog-title" sx={{ textAlign: 'center', pt: 3 }}>Bienvenido/a</DialogTitle>
                <DialogContent>
                    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>¿Ya eres paciente?</Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Ingresa tu DNI para una reserva más rápida. Si es tu primera vez, ingresa tu DNI y presiona "Buscar" para continuar.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                label="Ingresar DNI" variant="outlined" size="small"
                                value={dniInput}
                                onChange={(e) => { setDniInput(e.target.value); setDniLookupPerformed(false); }}
                                sx={{ flexGrow: 1 }}
                                onKeyPress={(e) => e.key === 'Enter' && handleDniLookup()}
                            />
                            <Button variant="contained" onClick={handleDniLookup} disabled={lookupLoading || !dniInput.trim()} startIcon={lookupLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}>
                                Buscar
                            </Button>
                        </Box>
                        {lookupError && <Alert severity="warning" sx={{ mt: 2 }}>{lookupError}</Alert>}
                        {dniLookupPerformed && recognizedPatient && recognizedPatient.id && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                ¡Hola, {recognizedPatient.fullName}! Tus datos se completarán automáticamente.
                            </Alert>
                        )}
                    </Paper>
                    <Alert severity="info" icon={false} sx={{ bgcolor: 'grey.100' }}>
                        <Typography variant="h6" component="div" gutterBottom>ATENCIÓN:</Typography>
                        <Typography variant="body2">El turno solicitado es un compromiso.</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Si no asistirá al turno solicitado, rogamos comuncarse y cancelar el mismo para liberar el horario y pueda ser usado por otro paciente. Agradecemos su compromiso y comprensión.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}>
                    <Button
                        onClick={handleCloseWelcomeModal}
                        variant="contained"
                        fullWidth
                        disabled={lookupLoading || !dniLookupPerformed}
                    >
                        Acepto, Continuar
                    </Button>
                </DialogActions>
            </Dialog>

            <Container 
                component="main" 
                maxWidth="lg" 
                sx={{ 
                    flexGrow: 1, display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'flex-start',
                    pt: 4, pb: 4
                }}
            >
                {currentStep === STEPS.SPECIALTY_SELECTION && !paramProfessionalId && <AnimatedStep key="step1"><SpecialtySelectionStep onSelectSpecialty={handleSelectSpecialty} /></AnimatedStep>}
                
                {currentStep === STEPS.PROFESSIONAL_SELECTION && <AnimatedStep key="step2">
                    <ProfessionalSelectionStep 
                        onSelectProfessional={handleSelectProfessional} 
                        professionals={professionals}
                        loading={loadingProfessionals}
                        error={errorProfessionals}
                        specialty={selectedSpecialty}
                    />
                     <Box sx={{ mt: 3 }}><Button variant="outlined" onClick={handleCancelForm}>Volver a Especialidades</Button></Box>
                </AnimatedStep>}
                
                {currentStep === STEPS.LOCATION_SELECTION && <AnimatedStep key="step3">
                    <Container sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="h4" gutterBottom>Seleccione un Consultorio</Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>¿Dónde desea atenderse con {selectedProfessionalName}?</Typography>
                        {loadingLocations && <CircularProgress />}
                        {errorLocations && <Alert severity="error">{errorLocations}</Alert>}
                        <Grid container spacing={3} justifyContent="center">
                            {locations.map(loc => (
                                <Grid item key={loc.id} xs={12} sm={6} md={4}>
                                    <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.03)' } }}>
                                        <CardActionArea onClick={() => handleSelectLocation(loc)} sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, textAlign: 'center' }}>
                                            <LocationOnOutlinedIcon color="primary" sx={{ fontSize: 40, mb: 2 }}/>
                                            <CardContent>
                                                <Typography gutterBottom variant="h6">{loc.name}</Typography>
                                                <Typography variant="body2" color="text.secondary">{loc.address}</Typography>
                                                {loc.department && <Typography variant="body2" color="text.secondary">{loc.department}</Typography>}
                                                <Typography variant="body2" color="text.secondary">{loc.city}</Typography>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        <Box sx={{ mt: 3 }}><Button variant="outlined" onClick={handleCancelForm}>Volver a Profesionales</Button></Box>
                    </Container>
                </AnimatedStep>}

                {currentStep === STEPS.CALENDAR_SELECTION && <AnimatedStep key="step4">
                    <Box sx={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Agendar turno con {selectedProfessionalName}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                            En: <strong>{selectedLocationName}</strong>
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: '700px' }}>
                            Haga clic sobre un horario disponible para comenzar su reserva.
                        </Typography>
                        {selectedProfessionalId && selectedLocationId ? (
                            <Box sx={{ width: '100%' }}>
                                 <AvailabilityCalendar onSlotSelect={handleSlotSelected} professionalId={selectedProfessionalId} locationId={selectedLocationId} />
                            </Box>
                        ) : <CircularProgress />}
                        <Box sx={{ mt: 3 }}>
                            <Button variant="outlined" onClick={handleCancelForm}>Volver</Button>
                        </Box>
                    </Box>
                </AnimatedStep>}

                {currentStep === STEPS.PATIENT_FORM && <AnimatedStep key="step5">
                    <Box sx={{ width: '100%', maxWidth: '700px' }}>
                        <PatientForm
                            selectedDateTime={selectedDateTime} onSubmit={handleFormSubmit} onCancel={handleCancelForm}
                            prefilledData={recognizedPatient} submissionError={submissionError} isSubmitting={isSubmitting}
                        />
                    </Box>
                </AnimatedStep>}

                {currentStep === STEPS.CONFIRMATION && <AnimatedStep key="step6">
                     <Box sx={{ width: '100%', maxWidth: '700px' }}>
                        <AppointmentConfirmation appointmentDetails={confirmedAppointment} onBookAnother={handleBookAnother} />
                    </Box>
                </AnimatedStep>}
            </Container>
            
            <style>
                {`
                    @keyframes fadeInSlideUp {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
        </Box>
    );
};

export default AppointmentBookingPage;