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
      const savedData = JSON.parse(savedDesign);  // Intentar parsear el JSON

      if (savedData && savedData.design) {
        const designObject = savedData.design;  // El diseño serializado en JSON (ya es un objeto)
        const widthMM = savedData.widthMM;  // Ancho en mm
        const heightMM = savedData.heightMM;  // Alto en mm

        // Restaurar el diseño en el lienzo
        canvas.loadFromJSON(designObject, canvas.renderAll.bind(canvas));

        // Restaurar el tamaño del lienzo en milímetros
        canvas.setWidth(widthMM * 3.77953);  // Convertir a píxeles
        canvas.setHeight(heightMM * 3.77953);  // Convertir a píxeles

        // También puedes actualizar los campos de entrada de tamaño si es necesario
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
  columns.forEach((column, index) => {
    const button = document.createElement('button');
    button.innerText = column;
    button.addEventListener('click', () => {
      // Agregar la columna al canvas como texto
      const text = new fabric.Textbox(column, {
        left: 50,
        top: 50 + (index * 30),  // Se coloca con un desplazamiento vertical para no superponerse
        fontSize: 20,
        fill: 'black',
      });
      canvas.add(text);
    });
    columnsListDiv.appendChild(button);
  });

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
    canvas.setWidth(this.value * 3.77953);
  });

  document.getElementById('height').addEventListener('input', function () {
    canvas.setHeight(this.value * 3.77953);
  });

  document.getElementById('addText').addEventListener('click', () => {
    const text = new fabric.Textbox('Texto editable', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: 'black',
    });
    canvas.add(text);
  });

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

  document.getElementById('addLine').addEventListener('click', () => {
    const line = new fabric.Line([50, 50, 200, 50], {
      left: 50,         // Posición inicial de la línea en X
      top: 50,          // Posición inicial de la línea en Y
      stroke: 'black',  // Color de la línea
      strokeWidth: 2,   // Grosor de la línea
    });

    // Añadir la línea al canvas
    canvas.add(line);
  });

  document.getElementById('deleteSelected').addEventListener('click', () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
    }
  });

  document.getElementById('saveDesign').addEventListener('click', () => {
    // Obtener el tamaño del lienzo en milímetros
    const widthMM = canvas.getWidth() / 3.77953;  // Convertir a mm
    const heightMM = canvas.getHeight() / 3.77953; // Convertir a mm

    // Serializar el diseño en JSON (ya está listo para ser guardado)
    const designJSON = canvas.toJSON();

    // Guardar el diseño y el tamaño en localStorage
    const savedDesign = {
      design: designJSON,  // El objeto JSON con los elementos del lienzo
      widthMM: widthMM,     // Guardar el ancho en mm
      heightMM: heightMM,   // Guardar el alto en mm
    };
    localStorage.setItem('savedDesign', JSON.stringify(savedDesign));

    console.log('Diseño y tamaño guardado en localStorage');
  });
});
