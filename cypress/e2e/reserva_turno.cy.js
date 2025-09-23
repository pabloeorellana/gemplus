describe('Flujo de Reserva de Turno para Pacientes', () => {
  it('Un paciente puede ingresar su DNI, seleccionar un profesional y reservar un turno exitosamente', () => {
    // Paso 1: Visitar la aplicación
    cy.visit('http://localhost:5173/');

    // Paso 2: Interactuar con la Landing Page
    cy.contains('Solicitar Turno').click();
    
    // Paso 3: Interactuar con el Modal de Bienvenida
    cy.contains('label', 'Ingresar DNI').parent().find('input').type('123456789');
      
    // Buscamos el botón "Buscar" y hacemos clic.
    cy.contains('button', 'Buscar').click();
    
    // Esperamos a que la búsqueda termine y aparezca el mensaje de validación.
    cy.contains('DNI no encontrado. Puede continuar y completar sus datos.').should('be.visible');

    // Hacemos clic en "Acepto, Continuar" para cerrar el modal.
    cy.contains('Acepto, Continuar').click();

    // Paso 4: Seleccionar un Profesional
    cy.contains('Seleccionar Profesional').first().click();

    // Paso 5: Seleccionar el Horario
    cy.contains('button', '20:00').click();

    // Paso 6: Rellenar el Formulario del Paciente
    cy.get('input[name="firstName"]').type('Cypress');
    cy.get('input[name="lastName"]').type('Test');
    cy.get('input[name="email"]').type('cypress.test@email.com');
    cy.get('input[name="phone"]').type('3811234567');

    // Paso 7: Confirmar el Turno
    cy.contains('Confirmar Turno').click();

    // Paso 8: Verificación Final (Assertion)
    cy.contains('¡Turno Confirmado!').should('be.visible');
  });
});