// En: src/pages/LandingPage/LandingPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box, Typography, Button, Container, AppBar, Toolbar, Grid, List, ListItem, ListItemIcon, ListItemText, Chip, Paper, TextField
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import MedicalInformationOutlinedIcon from '@mui/icons-material/MedicalInformationOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

import logoGEM from '/gemplus-logo.png'; 
import doctorHeroImage from '/doctor-hero.jpg';

const useOnScreen = (options) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entry.target);
            }
        }, options);
        const currentRef = ref.current;
        if (currentRef) { observer.observe(currentRef); }
        return () => { if (currentRef) { observer.unobserve(currentRef); } };
    }, [ref, options]);
    return [ref, isVisible];
};

const AnimatedSection = ({ children }) => {
    const [ref, isVisible] = useOnScreen({ threshold: 0.2 });
    return (
        <Box
            ref={ref}
            sx={{
                transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            }}
        >
            {children}
        </Box>
    );
};

const LandingPage = () => {
    return (
        <Box sx={{ backgroundColor: 'background.default' }}>
            <AppBar position="sticky" color="default" elevation={0}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters>
                        <Box component={RouterLink} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                            <Box component="img" src={logoGEM} alt="Gemplus logo" sx={{ height: 40 }} />
                        </Box>
                        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end' }}>
                            <Button href="#inicio" sx={{ fontWeight: 600 }}>Inicio</Button>
                            <Button href="#solucion" sx={{ fontWeight: 600 }}>Solucion</Button>
                            <Button href="#beneficios" sx={{ fontWeight: 600 }}>Beneficios</Button>
                            <Button href="#beneficios" sx={{ fontWeight: 600 }}>Planes</Button>                            
                             <Button component={RouterLink} to="/profesional/login" variant="contained" size="large" sx={{ py: 1.5, px: 2.5 }}>
                                    Acceso Profesionales
                                </Button>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* --- SECCIÓN HERO CORREGIDA Y MEJORADA --- */}
            <Box id="inicio" sx={{ position: 'relative', overflow: 'hidden', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', minHeight: { xs: 'auto', md: '80vh' } }}>
                <Box
                    sx={{
                        position: 'absolute', top: 0, right: 0, width: '55%', height: '100%', zIndex: 1,
                        maskImage: 'linear-gradient(to right, transparent 5%, black 40%)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent 5%, black 40%)',
                        display: { xs: 'none', md: 'block' }
                    }}
                >
                    <Box component="img" src={doctorHeroImage} alt="Fondo de profesional de la salud" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                
                <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
                    <Grid container>
                        <Grid item xs={12} md={6} sx={{ zIndex: 2, textAlign: { xs: 'center', md: 'left' } }}>
                             <Chip label="Nuestra Solución" color="primary" sx={{ mb: 2 }} />
                            <Typography variant="h3" component="h2" shape sx={{ fontWeight: 'bold', mb: 2 }}>
                                GEM Plus: La gestión de salud al alcance de tu mano.
                            </Typography>
                            <Typography variant="h6" color="text.secondary" paragraph>
                                Digitalizá tu consultorio, simplifica la vida de tus pacientes.
                            </Typography>
                            <Typography variant="h6" color="text.secondary" paragraph>
                                Una solución integral para médicos y profesionales de la salud.
                            </Typography>
                            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                                <Button component={RouterLink} to="/reservar-turno" variant="contained" size="large" sx={{ py: 1.5, px: 4 }}>
                                    Solicitar Turno
                                </Button>
                                <Button component={RouterLink} to="/profesional/login" variant="outlined" size="large" sx={{ py: 1.5, px: 4 }}>
                                    Acceso Profesionales
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
            
            <Box component="main">
                {/* --- SECCIÓN: ¿QUÉ ES EL CONSULTORIO? --- */}
                <Box id="que-es" sx={{ py: 8, backgroundColor: 'background.default' }}>
                    <Container maxWidth="lg">
                        <AnimatedSection>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row-reverse' }, alignItems: 'center', gap: 6 }}>
                                <Box sx={{ width: { xs: '100%', md: '50%' }, pl: { xs: 0, md: 3 } }}>
                                    <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                        Una solución pensada para vos:
                                    </Typography>
                                    <Typography paragraph color="text.secondary">Tanto si eres un paciente buscando comodidad o un profesional que desea optimizar su práctica, GEM Plus es la respuesta.</Typography>
                                    <ListItem><ListItemIcon><PersonOutlineOutlinedIcon color="primary" /></ListItemIcon><ListItemText primary="Para pacientes:" secondary="Comodidad y facilidad para reservar turnos y encontrar profesionales de cada especialidad." /></ListItem>
                                    <ListItem><ListItemIcon><MedicalServicesOutlinedIcon color="primary" /></ListItemIcon><ListItemText primary="Para profesionales:" secondary="Centraliza la gestión de tu consultorio, reduce el ausentismo con recordatorios automáticos y accede a la información de tus pacientes desde cualquier lugar. Simplifica tu día a día y dedica más tiempo a la atención médica." /></ListItem>
                                </Box>
                                <Box sx={{ width: { xs: '100%', md: '50%' }, pr: { xs: 0, md: 3 } }}>
                                    <Box component="img" src="https://media.istockphoto.com/id/1321112364/es/foto/nutricionista-mujer-con-laptop-da-consulta-a-paciente-en-interiores-en-la-oficina.jpg?s=612x612&w=0&k=20&c=eVS041CQYcUKKz6iP8rxFS50k30wUOkvhj7UeBAe30o=" alt="Profesional de la nutrición" sx={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '12px' }} />
                                </Box>
                            </Box>
                        </AnimatedSection>
                    </Container>
                </Box>

                {/* --- SECCIÓN: BENEFICIOS PARA TU SALUD --- */}
                <Box id="beneficios" sx={{ py: 8, backgroundColor: 'background.paper' }}>
                    <Container maxWidth="lg">
                        <AnimatedSection>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 6 }}>
                                <Box sx={{ width: { xs: '100%', md: '50%' }, pr: { xs: 0, md: 3 } }}>
                                    <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                                    Beneficios de usar GEM Plus:
                                    </Typography>
                                    <List>
                                        <ListItem><ListItemIcon><CalendarMonthOutlinedIcon color="primary" /></ListItemIcon><ListItemText primary="Gestión de Turnos Inteligente" secondary="Administra tu agenda de forma eficiente y permite a tus pacientes reservar en línea 24/7." /></ListItem>
                                        <ListItem><ListItemIcon><MedicalInformationOutlinedIcon color="primary" /></ListItemIcon><ListItemText primary="Historias Clínicas Digitales" secondary="Acceso rápido y seguro a la información completa y actualizada de tus pacientes." /></ListItem>
                                        <ListItem><ListItemIcon><QuestionAnswerOutlinedIcon color="primary" /></ListItemIcon><ListItemText primary="Comunicación Fluida con Pacientes" secondary="Envía recordatorios automáticos, confirmaciones de turnos y comunicados importantes." /></ListItem>
                                        <ListItem><ListItemIcon><HealthAndSafetyOutlinedIcon color="primary" /></ListItemIcon><ListItemText primary="Seguridad y Confianza" secondary="Protegemos tus datos y los de tus pacientes con los más altos estándares de seguridad." /></ListItem>
                                    </List>
                                </Box>
                                <Box sx={{ width: { xs: '100%', md: '50%' }, pl: { xs: 0, md: 3 } }}>
                                    <Box component="img" src="https://media.istockphoto.com/id/1492641547/es/foto/concepto-detox-mujer-afro-paciente-de-nutricionista-bebiendo-agua-de-lim%C3%B3n-mientras-el-m%C3%A9dico.jpg?s=612x612&w=0&k=20&c=mR_9GN-cg86nJwwNgT59JiTyT3AggPp24K7VFlyNywo=" alt="Nutrición y salud" sx={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '12px' }} />
                                </Box>
                            </Box>
                        </AnimatedSection>
                    </Container>
                </Box>
            </Box>

            {/* --- FOOTER --- */}
            <Box component="footer" sx={{ py: 4, backgroundColor: 'background.paper' }}>
                 <Container maxWidth="lg">
                    <Toolbar disableGutters>
                        <Box component="img" src={logoGEM} alt="Gemplus logo" sx={{ height: 30, mr: 1 }} />
                         <Box sx={{ flexGrow: 1 }} />
                         <Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} Gemplus. Todos los derechos reservados.</Typography>
                    </Toolbar>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;