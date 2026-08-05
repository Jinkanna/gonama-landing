document.addEventListener('DOMContentLoaded', () => {
  const sidebarItems = document.querySelectorAll('.sidebar-item');

  sidebarItems.forEach(item => {
    const toggleButton = item.querySelector('.sidebar-toggle-button'); // Botón del icono
    const submenuId = toggleButton?.getAttribute('aria-controls');
    const submenu = submenuId ? document.getElementById(submenuId) : null;
    const container = item.querySelector('.sidebar-item-container'); // Contenedor completo

    if (submenu) {
      // Función para abrir/cerrar el submenú
      const toggleSubmenu = () => {
        const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
          // Cerrar submenú
          toggleButton.setAttribute('aria-expanded', 'false');
          submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Fijar altura antes de colapsar
          requestAnimationFrame(() => {
            submenu.style.maxHeight = '0'; // Colapsar suavemente
          });

          // Cerrar todos los hijos (niveles anidados)
          const childSubmenus = submenu.querySelectorAll('.sidebar-hidden');
          childSubmenus.forEach(child => {
            const childButton = child.previousElementSibling.querySelector('.sidebar-toggle-button');
            if (childButton) {
              childButton.setAttribute('aria-expanded', 'false'); // Cerrar el botón del hijo
            }
            child.style.maxHeight = '0'; // Cerrar los hijos
          });
        } else {
          // Abrir submenú
          toggleButton.setAttribute('aria-expanded', 'true');
          submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Abrir suavemente
        }
      };

      // Asociar el comportamiento del icono al botón
      toggleButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevenir conflictos con otros clics
        toggleSubmenu(); // Ejecutar lógica de toggle
      });

      // Asociar el mismo comportamiento al contenedor completo
      container.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevenir conflictos
        event.preventDefault(); // Evitar recargas accidentales
        toggleSubmenu(); // Hacer que todo el contenedor actúe como el icono
      });

      // Ajustar altura automáticamente al finalizar la transición
      submenu.addEventListener('transitionend', () => {
        if (submenu.style.maxHeight !== '0px') {
          submenu.style.maxHeight = 'none'; // Fijar al abrir completamente
        }
      });
    }
  });
});
