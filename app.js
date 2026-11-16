/* =====================================================
   OJOS EN ALERTA - MONTE CRISTO
   LÓGICA GENERAL (CIUDADANO Y PANEL ADMINISTRADOR - GPS)
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // 1. LÓGICA DE LA VISTA CIUDADANA (index.html)
    const optionsModal = document.getElementById("optionsModal");
    const reportModal = document.getElementById("reportModal");
    const newsModal = document.getElementById("newsModal");
    const registerModal = document.getElementById("registerModal");

    const modalTitle = document.getElementById("modalTitle");
    const modalDescription = document.getElementById("modalDescription");
    const optionsContainer = document.getElementById("optionsContainer");

    const reportTitle = document.getElementById("reportTitle");
    const reportForm = document.getElementById("reportForm");
    const registerForm = document.getElementById("registerForm");
    const notificationsList = document.getElementById("notificationsList");
    let reportLocationInput = document.getElementById("reportLocation");

    let categoriaActual = "";
    let subcategoriaActual = "";
    let usuarioRegistrado = null;
    let gpsUbicacionActual = "Ubicando por GPS...";

    const colores = {
        "Asalto": "#f07819",
        "Ambulancia": "#e32636",
        "Violencia": "#7541a5",
        "Bomberos": "#f07819",
        "Móvil Policial": "#1e6091",
        "Alerta": "#d4a900",
        "911": "#c90020"
    };

    const opciones = {
        "Violencia": [
            "Familiar",
            "Doméstica",
            "Acoso"
        ],
        "Alerta": [
            "Desperfecto Mecánico",
            "Animales en Vía Pública",
            "Reclamos"
        ]
    };

    function abrirModal(modal) {
        if (modal) {
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
        }
    }

    function cerrarModal(modal) {
        if (modal) {
            modal.classList.remove("active");
            if (!document.querySelector(".modal-overlay.active")) {
                document.body.style.overflow = "";
            }
        }
    }

    document.querySelectorAll("[data-close]").forEach(boton => {
        boton.addEventListener("click", () => {
            const modal = boton.closest(".modal-overlay");
            cerrarModal(modal);
        });
    });

    document.querySelectorAll(".modal-overlay").forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                cerrarModal(modal);
            }
        });
    });

    document.querySelectorAll("[data-category]").forEach(boton => {
        boton.addEventListener("click", () => {
            const categoria = boton.dataset.category;
            if (opciones[categoria]) {
                mostrarOpciones(categoria);
            } else {
                abrirFormulario(categoria, "");
            }
        });
    });

    function mostrarOpciones(categoria) {
        categoriaActual = categoria;
        if (modalTitle) modalTitle.textContent = categoria.toUpperCase();
        if (modalDescription) modalDescription.textContent = "Seleccioná el tipo de situación que necesitás reportar.";
        if (optionsContainer) optionsContainer.innerHTML = "";

        opciones[categoria].forEach(opcion => {
            const boton = document.createElement("button");
            boton.className = "option-button";
            boton.textContent = opcion;
            boton.style.backgroundColor = colores[categoria] || "#123d60";

            boton.addEventListener("click", () => {
                subcategoriaActual = opcion;
                cerrarModal(optionsModal);
                abrirFormulario(categoria, opcion);
            });

            optionsContainer.appendChild(boton);
        });

        abrirModal(optionsModal);
    }

    function obtenerGPSAutomatico() {
        reportLocationInput = document.getElementById("reportLocation");
        if (reportLocationInput) {
            reportLocationInput.value = "Obteniendo ubicación GPS en Monte Cristo...";
            reportLocationInput.readOnly = true;
            reportLocationInput.style.backgroundColor = "#f1f5f9";
            reportLocationInput.style.color = "#64748b";
            reportLocationInput.style.fontWeight = "600";
        }

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(6);
                    const lon = position.coords.longitude.toFixed(6);
                    gpsUbicacionActual = `Lat: ${lat}, Lon: ${lon} (GPS Automático)`;
                    if (reportLocationInput) {
                        reportLocationInput.value = gpsUbicacionActual;
                    }
                },
                (error) => {
                    console.warn("Aviso GPS:", error.message);
                    gpsUbicacionActual = "Monte Cristo, Córdoba (Zona Centro - GPS estimado)";
                    if (reportLocationInput) {
                        reportLocationInput.value = gpsUbicacionActual;
                    }
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        } else {
            gpsUbicacionActual = "Monte Cristo, Córdoba (GPS no disponible)";
            if (reportLocationInput) {
                reportLocationInput.value = gpsUbicacionActual;
            }
        }
    }

    function abrirFormulario(categoria, subcategoria) {
        categoriaActual = categoria;
        subcategoriaActual = subcategoria;

        if (reportTitle) {
            reportTitle.textContent = subcategoria
                ? `${categoria} > ${subcategoria}`
                : categoria;
        }

        if (reportForm) reportForm.reset();
        abrirModal(reportModal);
        obtenerGPSAutomatico();
    }

    if (reportForm) {
        reportForm.addEventListener("submit", event => {
            event.preventDefault();

            reportLocationInput = document.getElementById("reportLocation");
            const descripcionInput = document.getElementById("reportDescription");

            const ubicacion = reportLocationInput ? reportLocationInput.value.trim() : gpsUbicacionActual;
            const descripcion = descripcionInput ? descripcionInput.value.trim() : "";

            if (!ubicacion) {
                alert("No se pudo registrar la ubicación GPS.");
                return;
            }

            const now = new Date();
            const timeStr = `Hoy ${now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} hs`;

            const nuevoAviso = {
                id: Date.now(),
                category: categoriaActual,
                subcategory: subcategoriaActual || null,
                color: categoriaActual === "Asalto" || categoriaActual === "Bomberos" ? "orange" :
                       categoriaActual === "Ambulancia" ? "red" :
                       categoriaActual === "Violencia" ? "violet" :
                       categoriaActual === "Móvil Policial" ? "blue" : "yellow",
                address: ubicacion,
                description: descripcion || "Sin descripción adicional.",
                reporter: usuarioRegistrado ? `${usuarioRegistrado.name} (${usuarioRegistrado.phone})` : "Usuario Anónimo",
                time: timeStr,
                status: "pending"
            };

            const alerts = getStoredAlerts();
            alerts.unshift(nuevoAviso);
            saveStoredAlerts(alerts);

            crearTarjetaCiudadano(nuevoAviso);
            cerrarModal(reportModal);
            reportForm.reset();
            alert("✅ ¡Alerta enviada con éxito utilizando GPS a la Central de Monitoreo!");
        });
    }

    function crearTarjetaCiudadano(aviso) {
        if (!notificationsList) return;

        const mensaje = document.createElement("article");
        mensaje.className = "notification-card";

        const color = colores[aviso.category] || "#123d60";
        mensaje.style.setProperty("--notification-color", color);

        const titulo = document.createElement("h3");
        titulo.textContent = aviso.subcategory
            ? `${aviso.category} > ${aviso.subcategory}`
            : aviso.category;

        const ubicacion = document.createElement("p");
        ubicacion.textContent = `Ubicación: ${aviso.address}`;

        mensaje.appendChild(titulo);
        mensaje.appendChild(ubicacion);

        if (aviso.description) {
            const descripcion = document.createElement("p");
            descripcion.textContent = `Detalle: ${aviso.description}`;
            mensaje.appendChild(descripcion);
        }

        const fecha = document.createElement("small");
        fecha.textContent = "Aviso registrado · " + aviso.time;
        mensaje.appendChild(fecha);

        const emptyMsg = notificationsList.querySelector(".empty-message");
        if (emptyMsg) {
            emptyMsg.remove();
        }

        notificationsList.prepend(mensaje);
    }

    const btn911 = document.getElementById("btn911");
    if (btn911) {
        btn911.addEventListener("click", () => {
            const confirmar = confirm(
                "Estás seleccionando el acceso al servicio de emergencias 911.\n\n" +
                "¿Deseás abrir la llamada telefónica?"
            );
            if (confirmar) {
                window.location.href = "tel:911";
            }
        });
    }

    const btnNoticias = document.getElementById("btnNoticias");
    if (btnNoticias) {
        btnNoticias.addEventListener("click", () => abrirModal(newsModal));
    }

    const btnRegistro = document.getElementById("btnRegistro");
    if (btnRegistro) {
        btnRegistro.addEventListener("click", () => abrirModal(registerModal));
    }

    if (registerForm) {
        registerForm.addEventListener("submit", event => {
            event.preventDefault();
            const nameInput = document.getElementById("userName");
            const phoneInput = document.getElementById("userPhone");

            const name = nameInput ? nameInput.value.trim() : "";
            const phone = phoneInput ? phoneInput.value.trim() : "";

            if (name && phone) {
                usuarioRegistrado = { name, phone };
                alert(`¡Registro exitoso!\nBienvenido/a, ${name}.`);
                registerForm.reset();
                cerrarModal(registerModal);
            }
        });
    }

    const storedAlerts = getStoredAlerts();
    if (storedAlerts.length > 0 && notificationsList) {
        storedAlerts.slice(0, 5).forEach(aviso => crearTarjetaCiudadano(aviso));
    }
});

// Almacenamiento local de avisos en este dispositivo.
// Esta versión es una demostración pública: no envía avisos a una central compartida.
function getStoredAlerts() {
    try {
        const data = localStorage.getItem("monte_cristo_alerts");
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("No se pudieron leer los avisos guardados:", error);
        return [];
    }
}

function saveStoredAlerts(alerts) {
    localStorage.setItem("monte_cristo_alerts", JSON.stringify(alerts));
}
