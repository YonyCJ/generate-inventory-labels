document.addEventListener('DOMContentLoaded', function () {
    // Leer los datos guardados en localStorage
    const tableData = JSON.parse(localStorage.getItem('qrTableData'));
    const savedDesign = JSON.parse(localStorage.getItem('savedDesign')); // Obtener el diseño guardado

    console.log(tableData);
    // Verificamos si los datos existen
    if (!tableData) {
        alert("No se encontraron datos en localStorage.");
        return;
    }

    const { columns, rows } = tableData; // Extraemos las columnas y filas del objeto guardado

    // Verificamos que el elemento de la tabla esté presente
    const tableHead = document.querySelector("#data-table thead tr");

    // Verificar si se obtuvo el encabezado correctamente
    if (!tableHead) {
        console.error("No se encontró el encabezado de la tabla.");
        return;
    }

    // Limpiamos los encabezados actuales y agregamos las columnas seleccionadas
    tableHead.innerHTML = ''; // Limpiamos los encabezados actuales

    // Agregar encabezado "Seleccionar"
    const thCheck = document.createElement("th");
    thCheck.textContent = "Seleccionar";
    tableHead.appendChild(thCheck);

    // Agregar las columnas seleccionadas como encabezados de la tabla
    columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col; // Nombre de la columna
        tableHead.appendChild(th);
    });

    // Agregar columna para "Generar"
    const thGenerate = document.createElement("th");
    thGenerate.textContent = "Generar";
    tableHead.appendChild(thGenerate);

    // Rellenar el cuerpo de la tabla con las filas de datos
    const tableBody = document.querySelector("#data-table tbody");

    // Verificar si se obtuvo el cuerpo de la tabla correctamente
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla.");
        return;
    }

    tableBody.innerHTML = ''; // Limpiar las filas actuales

    // Agregar filas a la tabla
    rows.forEach((rowData) => {
        const tr = document.createElement("tr");

        // Crear celda de checkbox para seleccionar la fila
        const tdCheck = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        tdCheck.appendChild(checkbox);
        tr.appendChild(tdCheck);

        // Llenar las celdas de la fila con los datos de cada columna seleccionada
        columns.forEach((col) => {
            const td = document.createElement("td");
            td.textContent = rowData[col] || ""; // Mostrar el valor o vacío si no existe
            tr.appendChild(td);
        });

        // Columna para generar acción (Generar QR)
        const tdGenerate = document.createElement("td");
        const generateButton = document.createElement("button");
        generateButton.textContent = "Generar QR"; // Botón para generar el QR
        tdGenerate.appendChild(generateButton);
        tr.appendChild(tdGenerate);

        // Agregar la fila a la tabla
        tableBody.appendChild(tr);

        // Event listener para generar PDF al hacer clic en "Generar QR"
        generateButton.addEventListener('click', function () {
            // Mostrar el modal para seleccionar la orientación
            const orientationModal = document.getElementById("orientation-modal");
            orientationModal.style.display = "flex";

            // Función para manejar la orientación seleccionada
            document.getElementById("portrait-btn").addEventListener("click", function () {
                orientationModal.style.display = "none"; // Ocultar el modal de orientación
                generatePDF(rowData, savedDesign, columns, "portrait");
            });

            document.getElementById("landscape-btn").addEventListener("click", function () {
                orientationModal.style.display = "none"; // Ocultar el modal de orientación
                generatePDF(rowData, savedDesign, columns, "landscape");
            });
        });
    });

    // Funcionalidad para el botón Cancelar
    const cancelButton = document.getElementById("cancel-button");
    cancelButton.addEventListener("click", function () {
        // Redirigir a dashboard.html al hacer clic en "Cancelar"
        window.location.href = "dashboard.html"; // Cambia esta ruta si es necesario
    });
});


// Función para actualizar el diseño con los datos de la fila
function updateDesignWithData(rowData, savedDesign, columns) {
    // Recorremos los objetos del diseño guardado
    savedDesign.design.objects.forEach(obj => {
        if (obj.type === "textbox") {
            // Verificar si el texto del objeto coincide con una columna
            const columnMatch = columns.find(column => column === obj.text);
            if (columnMatch) {
                // Actualizar el texto del objeto con los datos correspondientes
                obj.text = rowData[columnMatch] || "No disponible"; // Reemplazar por el valor o "No disponible"
            }
        }
    });

    // Almacenar el diseño actualizado en localStorage
    localStorage.setItem('savedDesign', JSON.stringify(savedDesign));
    return savedDesign;
}

// Función para convertir el diseño a imagen
// Función para convertir el diseño a imagen
function designToImage(savedDesign, columns) {
    return new Promise((resolve, reject) => {
        // Crear un canvas para dibujar el diseño
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Definir las dimensiones del canvas según el diseño (en pixeles)
        const canvasWidth = savedDesign.widthMM * 3.77953; // Convertir mm a px
        const canvasHeight = savedDesign.heightMM * 3.77953; // Convertir mm a px
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        let loadedImages = 0;
        let totalImages = 0;

        // Contamos cuántas imágenes necesitamos cargar
        savedDesign.design.objects.forEach(obj => {
            if (obj.type === 'image') {
                totalImages++;
            }
        });

        // Dibujar los objetos del diseño en el canvas
        savedDesign.design.objects.forEach(obj => {
            if (obj.type === 'rect') {
                ctx.fillStyle = obj.fill || 'transparent';
                ctx.fillRect(obj.left, obj.top, obj.width, obj.height);
            } else if (obj.type === 'line') {
                ctx.beginPath();
                ctx.moveTo(obj.x1, obj.y1);
                ctx.lineTo(obj.x2, obj.y2);
                ctx.strokeStyle = obj.stroke || '#000';
                ctx.lineWidth = obj.strokeWidth || 1;
                ctx.stroke();
            } else if (obj.type === 'textbox') {
                ctx.font = `${obj.fontSize}px Arial`;
                ctx.fillText(obj.text, obj.left, obj.top + obj.fontSize);
            } else if (obj.type === 'image') {
                const img = new Image();
                img.src = obj.src;
                img.onload = () => {
                    ctx.drawImage(img, obj.left, obj.top, obj.width, obj.height);
                    loadedImages++;

                    // Si todas las imágenes están cargadas, resolvemos la promesa
                    if (loadedImages === totalImages) {
                        resolve(canvas.toDataURL('image/png')); // Esto devuelve la imagen en base64
                    }
                };
                img.onerror = reject;  // Si hay un error al cargar la imagen, rechazamos la promesa
            }
        });

        // Si no hay imágenes en el diseño, resolvemos la promesa directamente
        if (totalImages === 0) {
            resolve(canvas.toDataURL('image/png'));
        }
    });
}


// Función para generar el PDF y mostrarlo en el modal de vista previa
async function generatePDF(rowData, savedDesign, columns, orientation = "portrait") {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(orientation);

    try {
        // Convertir el diseño a imagen (base64) de forma asincrónica
        const designImage = await designToImage(savedDesign, columns);

        // Verificar si el diseño tiene el formato adecuado
        if (!designImage || !designImage.startsWith('data:image/png;base64,')) {
            throw new Error("La imagen generada no tiene el formato correcto.");
        }

        // Definir márgenes de la página
        const margin = 1.5;  // Margen de 1.5 mm
        const pageWidth = orientation === "portrait" ? 210 : 297;
        const pageHeight = orientation === "portrait" ? 297 : 210;

        // ** Nuevo tamaño pequeño fijo para la imagen **
        const smallWidth = 50;  // Ancho en mm
        const smallHeight = 25;  // Alto en mm

        // ** Posicionar la imagen en la parte superior izquierda con un margen de 1.5 mm **
        const xPos = margin;  // Margen a la izquierda
        const yPos = margin;  // Margen superior

        // Insertar la imagen redimensionada en el PDF (tamaño pequeño fijo)
        doc.addImage(designImage, 'PNG', xPos, yPos, smallWidth, smallHeight);

        // Mostrar el PDF en el modal de vista previa
        const pdfOutput = doc.output('bloburl');
        const previewModal = document.getElementById("pdf-preview-modal");
        const previewIframe = document.getElementById("pdf-preview-iframe");
        previewIframe.src = pdfOutput;
        previewModal.style.display = "flex";
    } catch (error) {
        console.error("Error al generar el PDF:", error);
    }
}



//------------------------------------------------------

// Obtener los elementos del modal de configuración
var modal = document.getElementById("config-modal");
var btn = document.getElementById("config-button");
var closeModalBtn = document.getElementById("close-modal");
var span = document.getElementsByClassName("close")[0];

// Cuando el usuario hace clic en el botón "Configurar Etiqueta", muestra el modal
btn.onclick = function() {
    modal.style.display = "flex"; // Cambiar a 'flex' para asegurarnos de que se muestre centrado
}

// Cuando el usuario hace clic en <span> (x), cierra el modal
span.onclick = function() {
    modal.style.display = "none"; // Oculta el modal
}

// Cuando el usuario hace clic en el botón "Cerrar" dentro del modal, lo cierra
closeModalBtn.onclick = function() {
    modal.style.display = "none"; // Oculta el modal
}

// Cuando el usuario hace clic fuera del modal, también lo cierra
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none"; // Oculta el modal
    }
}

//------------------------------------------------------

// Obtener los elementos del modal de vista previa PDF
var pdfPreviewModal = document.getElementById("pdf-preview-modal");
var closePdfPreviewBtn = document.getElementById("close-pdf-preview");

// Cuando el usuario hace clic en el botón "Cerrar" de la vista previa, lo cierra
closePdfPreviewBtn.onclick = function() {
    pdfPreviewModal.style.display = "none"; // Oculta el modal de vista previa
}

// Cuando el usuario hace clic fuera del modal de vista previa, también lo cierra
window.onclick = function(event) {
    if (event.target == pdfPreviewModal) {
        pdfPreviewModal.style.display = "none"; // Oculta el modal de vista previa
    }
}
