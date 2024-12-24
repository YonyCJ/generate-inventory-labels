let globalUpdatedDesign;
let globalGeneratedImage;

document.addEventListener('DOMContentLoaded', function () {
    const tableData = JSON.parse(localStorage.getItem('qrTableData'));
    const savedDesign = JSON.parse(localStorage.getItem('savedDesign'));

    console.log(tableData);
    if (!tableData) {
        alert("No se encontraron datos en localStorage.");
        return;
    }

    const { columns, rows } = tableData;
    const tableHead = document.querySelector("#data-table thead tr");

    if (!tableHead) {
        console.error("No se encontró el encabezado de la tabla.");
        return;
    }

    tableHead.innerHTML = '';

    const thCheck = document.createElement("th");
    thCheck.textContent = "Seleccionar";
    tableHead.appendChild(thCheck);

    columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        tableHead.appendChild(th);
    });

    const thGenerate = document.createElement("th");
    thGenerate.textContent = "Generar";
    tableHead.appendChild(thGenerate);

    const tableBody = document.querySelector("#data-table tbody");

    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla.");
        return;
    }

    tableBody.innerHTML = '';

    // Función para manejar la orientación
    function handleOrientation(orientation, rowData, savedDesign, columns) {
        const orientationModal = document.getElementById("orientation-modal");
        orientationModal.style.display = "none";
        
        globalUpdatedDesign = updateDesignWithData(rowData, savedDesign, columns);
        console.log('Diseño global actualizado:', globalUpdatedDesign);
        
        generateImageFromDesign()
            .then(() => {
                console.log('Imagen global generada:', globalGeneratedImage);
                generatePDF(rowData, savedDesign, columns, orientation);
            })
            .catch(error => console.error("Error en el proceso:", error));
    }

    rows.forEach((rowData) => {
        const tr = document.createElement("tr");

        const tdCheck = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        tdCheck.appendChild(checkbox);
        tr.appendChild(tdCheck);

        columns.forEach((col) => {
            const td = document.createElement("td");
            td.textContent = rowData[col] || "";
            tr.appendChild(td);
        });

        const tdGenerate = document.createElement("td");
        const generateButton = document.createElement("button");
        generateButton.textContent = "Generar QR";
        tdGenerate.appendChild(generateButton);
        tr.appendChild(tdGenerate);

        tableBody.appendChild(tr);

        generateButton.addEventListener('click', function () {
            const orientationModal = document.getElementById("orientation-modal");
            orientationModal.style.display = "flex";

            const portraitBtn = document.getElementById("portrait-btn");
            const landscapeBtn = document.getElementById("landscape-btn");

            // Remover listeners anteriores
            const newPortraitBtn = portraitBtn.cloneNode(true);
            const newLandscapeBtn = landscapeBtn.cloneNode(true);
            portraitBtn.parentNode.replaceChild(newPortraitBtn, portraitBtn);
            landscapeBtn.parentNode.replaceChild(newLandscapeBtn, landscapeBtn);

            // Agregar nuevos listeners
            newPortraitBtn.addEventListener("click", () => handleOrientation("portrait", rowData, savedDesign, columns));
            newLandscapeBtn.addEventListener("click", () => handleOrientation("landscape", rowData, savedDesign, columns));
        });
    });

    const cancelButton = document.getElementById("cancel-button");
    cancelButton.addEventListener("click", function () {
        window.location.href = "dashboard.html";
    });
});

// Función para actualizar el diseño con los datos de la fila
function updateDesignWithData(rowData, savedDesign, columns) {
    const updatedDesign = JSON.parse(JSON.stringify(savedDesign)); // Crear copia profunda
    // Recorremos los objetos del diseño guardado
    updatedDesign.design.objects.forEach(obj => {
        if (obj.type === "textbox") {
            // Verificar si el texto del objeto coincide con una columna
            const columnMatch = columns.find(column => column === obj.text);
            if (columnMatch) {
                // Actualizar el texto del objeto con los datos correspondientes
                obj.text = rowData[columnMatch] || "No disponible"; // Reemplazar por el valor o "No disponible"
            }
        }
    });
    return updatedDesign;
}
// Función auxiliar para calcular el tamaño de texto que se ajuste al ancho disponible
function calculateFittingFontSize(ctx, text, maxWidth, maxHeight, fontSize) {
    let currentSize = fontSize;
    
    // Reducir el tamaño de la fuente hasta que el texto quepa en el ancho
    while (currentSize > 0) {
        ctx.font = `${currentSize}px Arial`;
        const textWidth = ctx.measureText(text).width;
        if (textWidth <= maxWidth && currentSize <= maxHeight) {
            return currentSize;
        }
        currentSize--;
    }
    return currentSize;
}

// Primero las funciones auxiliares necesarias
function calculateTextLines(ctx, text, maxWidth, fontSize) {
    ctx.font = `${fontSize}px Arial`;
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function drawTextWithAutoWrap(ctx, obj) {
    const maxWidth = obj.width * (obj.scaleX || 1);
    const maxHeight = obj.height * (obj.scaleY || 1);
    let fontSize = obj.fontSize || 16;
    
    // Empezar con el tamaño de fuente original
    ctx.font = `${obj.fontStyle || ''} ${obj.fontWeight || ''} ${fontSize}px ${obj.fontFamily || 'Arial'}`;
    
    // Calcular las líneas con el tamaño de fuente actual
    let lines = calculateTextLines(ctx, obj.text, maxWidth, fontSize);
    
    // Reducir el tamaño de la fuente si el texto es demasiado alto
    while (lines.length * (fontSize * 1.2) > maxHeight && fontSize > 8) {
        fontSize--;
        ctx.font = `${obj.fontStyle || ''} ${obj.fontWeight || ''} ${fontSize}px ${obj.fontFamily || 'Arial'}`;
        lines = calculateTextLines(ctx, obj.text, maxWidth, fontSize);
    }
    
    // Dibujar cada línea de texto
    const lineHeight = fontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;
    let startY = obj.top + (maxHeight - totalTextHeight) / 2 + fontSize;
    
    ctx.fillStyle = obj.fill || '#000000';
    ctx.textAlign = obj.textAlign || 'left';
    
    lines.forEach((line, index) => {
        let x = obj.left;
        if (obj.textAlign === 'center') {
            x = obj.left + maxWidth / 2;
        } else if (obj.textAlign === 'right') {
            x = obj.left + maxWidth;
        }
        
        ctx.fillText(line, x, startY + index * lineHeight);
    });
}

// La función principal actualizada
function designToImage() {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Aumentamos la escala para mejor resolución (factor de 2)
        const scaleFactor = 2;
        const mmToPx = 3.77953 * scaleFactor;
        
        const canvasWidth = globalUpdatedDesign.widthMM * mmToPx;
        const canvasHeight = globalUpdatedDesign.heightMM * mmToPx;
        
        // Configurar el canvas con las nuevas dimensiones
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Aplicar configuración para mejor calidad de renderizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Escalar el contexto para mantener las proporciones correctas
        ctx.scale(scaleFactor, scaleFactor);

        // Fondo blanco por defecto
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        let loadedImages = 0;
        let totalImages = 0;

        globalUpdatedDesign.design.objects.forEach(obj => {
            if (obj.type === 'image') totalImages++;
        });

        // Dibujar objetos en el canvas
        globalUpdatedDesign.design.objects.forEach(obj => {
            ctx.save();

            if (obj.angle) {
                const centerX = obj.left + (obj.width * (obj.scaleX || 1)) / 2;
                const centerY = obj.top + (obj.height * (obj.scaleY || 1)) / 2;
                ctx.translate(centerX, centerY);
                ctx.rotate((obj.angle * Math.PI) / 180);
                ctx.translate(-centerX, -centerY);
            }

            if (obj.type === 'rect') {
                if (obj.rx && obj.ry) {
                    roundRect(ctx, obj.left, obj.top, obj.width * (obj.scaleX || 1), obj.height * (obj.scaleY || 1), obj.rx, obj);
                } else {
                    if (obj.fill && obj.fill !== 'transparent') {
                        ctx.fillStyle = obj.fill;
                        ctx.fillRect(obj.left, obj.top, obj.width * (obj.scaleX || 1), obj.height * (obj.scaleY || 1));
                    }
                    if (obj.stroke && obj.strokeWidth) {
                        ctx.strokeStyle = obj.stroke;
                        ctx.lineWidth = obj.strokeWidth;
                        ctx.strokeRect(obj.left, obj.top, obj.width * (obj.scaleX || 1), obj.height * (obj.scaleY || 1));
                    }
                }
            } else if (obj.type === 'line') {
                ctx.beginPath();
                ctx.moveTo(obj.x1 + obj.left, obj.y1 + obj.top);
                ctx.lineTo(obj.x2 + obj.left, obj.y2 + obj.top);
                ctx.strokeStyle = obj.stroke || '#000';
                ctx.lineWidth = obj.strokeWidth || 1;
                ctx.stroke();
            } else if (obj.type === 'textbox') {
                const maxWidth = obj.width * (obj.scaleX || 1);
                const maxHeight = obj.height * (obj.scaleY || 1);
            
                // Aumentar el tamaño base de la fuente para mejor nitidez
                let fontSize = obj.fontSize * 0.6 || 16;
            
                ctx.font = `${obj.fontStyle || ''} ${obj.fontWeight || 'bold'} ${fontSize}px ${obj.fontFamily || 'Arial'}`;
                ctx.fillStyle = obj.fill || '#000';
                ctx.textAlign = 'center'; // Centrado horizontal
                ctx.textBaseline = 'middle'; // Centrado vertical
            
                // Mejorar la renderización del texto
                ctx.textRendering = 'geometricPrecision';
            
                // Dividir el texto en líneas si excede el ancho máximo
                const words = obj.text.split(' ');
                let line = '';
                const lines = [];
                const lineHeight = fontSize * 1.2; // Espaciado entre líneas
            
                words.forEach(word => {
                    const testLine = line + (line ? ' ' : '') + word;
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && line !== '') {
                        lines.push(line);
                        line = word;
                    } else {
                        line = testLine;
                    }
                });
            
                lines.push(line);
            
                // Calcular la posición inicial para centrar el texto verticalmente
                const totalHeight = lines.length * lineHeight;
                let startY = obj.top + maxHeight / 2 - totalHeight / 2;
            
                // Dibujar cada línea centrada
                lines.forEach(line => {
                    ctx.fillText(line, obj.left + maxWidth / 2, startY + lineHeight / 2);
                    startY += lineHeight;
                });
            }
             else if (obj.type === 'image') {
                const img = new Image();
                img.src = obj.src;
                
                // Configurar la calidad de la imagen
                img.setAttribute('rendering', 'crisp-edges');
                
                img.onload = () => {
                    ctx.drawImage(
                        img,
                        obj.left,
                        obj.top,
                        obj.width * (obj.scaleX || 1),
                        obj.height * (obj.scaleY || 1)
                    );
                    loadedImages++;
                    if (loadedImages === totalImages) {
                        resolve(canvas.toDataURL('image/png', 1.0)); // Máxima calidad
                    }
                };
                img.onerror = reject;
            }

            ctx.restore();
        });

        if (totalImages === 0) {
            resolve(canvas.toDataURL('image/png', 1.0)); // Máxima calidad
        }
    });
}

// Función auxiliar para dibujar rectángulos redondeados
function roundRect(ctx, x, y, width, height, radius, obj) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (obj.fill && obj.fill !== 'transparent') {
        ctx.fillStyle = obj.fill;
        ctx.fill();
    }
    if (obj.stroke && obj.strokeWidth) {
        ctx.strokeStyle = obj.stroke;
        ctx.lineWidth = obj.strokeWidth;
        ctx.stroke();
    }
}

async function generateImageFromDesign() {
    try {
        // Generar imagen desde globalUpdatedDesign
        const generatedImage = await designToImage();
        globalGeneratedImage = generatedImage; // Guardar imagen globalmente
        return generatedImage;
    } catch (error) {
        console.error("Error generando imagen:", error);
        throw error;
    }
}

// Función para generar PDF desde el diseño actualizado
async function generatePDF(orientation = "portrait") {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF(orientation, 'mm', 'a4', true); // Activar compresión mejorada

    try {
        if (!globalGeneratedImage) {
            await generateImageFromDesign();
        }

        if (!globalGeneratedImage || !globalGeneratedImage.startsWith('data:image/png;base64,')) {
            throw new Error("La imagen generada no tiene el formato correcto.");
        }

        const margin = 1.5;
        const smallWidth = 50;
        const smallHeight = 25;
        const xPos = margin;
        const yPos = margin;

        // Agregar imagen con mejor calidad
        doc.addImage(globalGeneratedImage, 'PNG', xPos, yPos, smallWidth, smallHeight, '', 'FAST', 0);

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










function generateImageFromSavedDesign() {
    const savedDesign = JSON.parse(localStorage.getItem('savedDesign'));

    if (!savedDesign || !savedDesign.design || !savedDesign.design.objects) {
        console.error("No se encontró el diseño o los objetos en el diseño.");
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Configura el tamaño del lienzo en función del diseño guardado
    const canvasWidth = savedDesign.widthMM * 3.77953; // Convertir de milímetros a píxeles
    const canvasHeight = savedDesign.heightMM * 3.77953;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    let loadedImages = 0;
    let totalImages = 0;

    // Contamos el número de objetos de tipo imagen para esperar que se carguen todos
    savedDesign.design.objects.forEach(obj => {
        if (obj.type === 'image') {
            totalImages++;
        }
    });

    // Dibuja los objetos en el lienzo
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
                // Cuando se han cargado todas las imágenes, imprimimos la imagen generada
                if (loadedImages === totalImages) {
                    const generatedImage = canvas.toDataURL('image/png');
                    console.log('Imagen generada desde el diseño original:', generatedImage);
                }
            };
            img.onerror = () => {
                console.error('Error al cargar la imagen:', obj.src);
            };
        }
    });

    // Si no hay imágenes, generamos la imagen directamente
    if (totalImages === 0) {
        const generatedImage = canvas.toDataURL('image/png');
        console.log('Imagen generada desde el diseño original (sin imágenes):', generatedImage);
    }
}

generateImageFromSavedDesign();
