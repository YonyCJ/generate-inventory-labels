document.addEventListener('DOMContentLoaded', () => {
  const canvas = new fabric.Canvas('canvas', {
    width: 297 * 3.77953,
    height: 210 * 3.77953,
    backgroundColor: '#ffffff',
  });

  // Cargar el diseño desde localStorage si existe
  const savedDesign = localStorage.getItem('savedDesign');
  if (savedDesign) {
    try {
      const savedData = JSON.parse(savedDesign);

      if (savedData && savedData.design) {
        const designObject = savedData.design;
        const widthMM = savedData.widthMM;
        const heightMM = savedData.heightMM;

        // Restaurar el diseño en el lienzo
        canvas.loadFromJSON(designObject, canvas.renderAll.bind(canvas));

        // Restaurar el tamaño del lienzo en milímetros
        canvas.setWidth(widthMM * 3.77953);
        canvas.setHeight(heightMM * 3.77953);

        // Actualizar los campos de entrada de tamaño
        document.getElementById('width').value = widthMM;
        document.getElementById('height').value = heightMM;
      }
    } catch (error) {
      console.error('Error al cargar el diseño desde localStorage:', error);
    }
  }

  // Recuperar las columnas desde localStorage
  const qrTableData = JSON.parse(localStorage.getItem('qrTableData'));
  const columns = qrTableData ? qrTableData.columns : [];

  // Mostrar las columnas disponibles en el HTML
  const columnsListDiv = document.getElementById('columnsList');
  if (columnsListDiv) {
    columns.forEach((column, index) => {
      const button = document.createElement('button');
      button.innerText = column;
      button.addEventListener('click', () => {
        const text = new fabric.Textbox(column, {
          left: 50,
          top: 50 + index * 30,
          fontSize: 20,
          fill: 'black',
        });
        canvas.add(text);
      });
      columnsListDiv.appendChild(button);
    });
  } else {
    console.error("El contenedor 'columnsList' no se encuentra en el DOM.");
  }

  // Cambiar tamaño del lienzo
  document.getElementById('canvasSize').addEventListener('change', function () {
    const canvasSize = this.value;
    if (canvasSize === 'a4') {
      canvas.setWidth(297 * 3.77953);
      canvas.setHeight(210 * 3.77953);
      document.getElementById('width').value = 297;
      document.getElementById('height').value = 210;
      document.getElementById('width').disabled = true;
      document.getElementById('height').disabled = true;
    } else {
      document.getElementById('width').disabled = false;
      document.getElementById('height').disabled = false;
    }
  });

  document.getElementById('width').addEventListener('input', function () {
    if (!document.getElementById('width').disabled) {
      canvas.setWidth(this.value * 3.77953);
    }
  });

  document.getElementById('height').addEventListener('input', function () {
    if (!document.getElementById('height').disabled) {
      canvas.setHeight(this.value * 3.77953);
    }
  });

  // Agregar texto
  document.getElementById('addText').addEventListener('click', () => {
    const text = new fabric.Textbox('Texto editable', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: 'black',
    });
    canvas.add(text);
  });

  // Agregar imagen
  document.getElementById('addImage').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          fabric.Image.fromURL(event.target.result, (img) => {
            img.set({ left: 100, top: 100, scaleX: 0.5, scaleY: 0.5 });
            canvas.add(img);
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  });

  // Agregar forma
  document.getElementById('addShape').addEventListener('click', () => {
    const rect = new fabric.Rect({
      left: 50,
      top: 50,
      width: 150,
      height: 100,
      fill: 'transparent',
      stroke: 'black',
      strokeWidth: 2,
      rx: 15,
      ry: 15,
    });
    canvas.add(rect);
  });

  // Agregar línea
  document.getElementById('addLine').addEventListener('click', () => {
    const line = new fabric.Line([50, 50, 200, 50], {
      left: 50,
      top: 50,
      stroke: 'black',
      strokeWidth: 2,
    });
    canvas.add(line);
  });

  // Eliminar objeto seleccionado
  document.getElementById('deleteSelected').addEventListener('click', () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
    }
  });

  // Guardar diseño
  document.getElementById('saveDesign').addEventListener('click', () => {
    const widthMM = canvas.getWidth() / 3.77953;
    const heightMM = canvas.getHeight() / 3.77953;

    const designJSON = canvas.toJSON();

    const savedDesign = {
      design: designJSON,
      widthMM: widthMM,
      heightMM: heightMM,
    };
    localStorage.setItem('savedDesign', JSON.stringify(savedDesign));

    console.log('Diseño y tamaño guardado en localStorage');
  });

  // Función para descargar el diseño en formato JSON
  document.getElementById('downloadDesignJson').addEventListener('click', () => {
    const savedDesign = localStorage.getItem('savedDesign');
    if (savedDesign) {
      try {
        const savedData = JSON.parse(savedDesign);

        // Crear un objeto que incluya tanto el diseño como las dimensiones
        const designData = {
          design: savedData.design,
          widthMM: savedData.widthMM,
          heightMM: savedData.heightMM
        };

        // Convertir el diseño a una cadena JSON
        const designJson = JSON.stringify(designData, null, 2); // Indentación de 2 espacios

        // Crear un enlace de descarga
        const link = document.createElement('a');
        const blob = new Blob([designJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        link.href = url;
        link.download = 'diseño.json';  // Nombre del archivo a descargar
        link.click();  // Iniciar la descarga

        // Liberar el objeto URL
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error al generar el archivo JSON para la descarga:', error);
      }
    } else {
      console.log('No hay diseño guardado para descargar');
    }
  });


  // Función para cargar el diseño desde un archivo JSON y guardarlo en localStorage
  document.getElementById('loadDesign').addEventListener('click', () => {
    // Crear un input para seleccionar un archivo JSON
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json'; // Solo archivos JSON

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            // Parsear el contenido del archivo JSON
            const designData = JSON.parse(event.target.result);

            // Verificar si el archivo tiene el formato correcto
            if (designData && designData.design && designData.widthMM && designData.heightMM) {
              // Restaurar el diseño en el lienzo
              canvas.loadFromJSON(designData.design, canvas.renderAll.bind(canvas));

              // Ajustar el tamaño del lienzo
              canvas.setWidth(designData.widthMM * 3.77953);
              canvas.setHeight(designData.heightMM * 3.77953);

              // Actualizar los campos de tamaño
              document.getElementById('width').value = designData.widthMM;
              document.getElementById('height').value = designData.heightMM;

              // Guardar el diseño en localStorage
              localStorage.setItem('savedDesign', event.target.result);

              console.log('Diseño cargado y guardado en localStorage exitosamente');
            } else {
              console.error('El archivo JSON no tiene el formato esperado');
            }
          } catch (error) {
            console.error('Error al cargar el archivo JSON:', error);
          }
        };
        reader.readAsText(file); // Leer el archivo como texto
      }
    };

    input.click(); // Abrir el cuadro de diálogo de selección de archivos
  });




  // Función para previsualizar el diseño como imagen
  document.getElementById('previewDesign').addEventListener('click', () => {
    const savedDesign = localStorage.getItem('savedDesign');
    if (savedDesign) {
      try {
        const savedData = JSON.parse(savedDesign);

        // Crear un canvas temporal para generar la imagen
        const tempCanvas = new fabric.Canvas(null, {
          width: savedData.widthMM * 3.77953,
          height: savedData.heightMM * 3.77953,
          backgroundColor: '#ffffff',
        });

        // Cargar el diseño en el canvas temporal
        tempCanvas.loadFromJSON(savedData.design, () => {
          // Generar la imagen como dataURL
          const dataURL = tempCanvas.toDataURL({ format: 'png' });

          // Obtener el contenedor y la imagen de previsualización
          const previewContainer = document.getElementById('previewContainer');
          const previewImage = document.getElementById('previewImage');

          // Hacer visible el contenedor de la previsualización
          previewContainer.style.display = 'block';

          // Asignar la imagen generada al src de la imagen
          previewImage.src = dataURL;

          console.log('Previsualización generada como imagen', dataURL);
        });
      } catch (error) {
        console.error('Error al generar la previsualización como imagen:', error);
      }
    } else {
      console.log('No hay diseño guardado para previsualizar');
    }
  });
});
