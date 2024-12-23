let data = []; // Datos cargados del archivo Excel
let selectedItems = new Set(); // Elementos seleccionados
let filteredData = []; // Datos filtrados
let columns = []; // Columnas disponibles para filtrar

function uploadFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx, .xls";
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const dataBuffer = event.target.result;
                const workbook = XLSX.read(dataBuffer, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Leer el archivo Excel
                const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

                // Actualizar columnas globales
                columns = excelData[0];

                // Convertir las filas a objetos y actualizar la variable global data
                data = excelData.slice(1).map(row => {
                    let obj = {};
                    columns.forEach((col, idx) => {
                        obj[col] = row[idx] || "";
                    });
                    return obj;
                });

                // Guardar los datos en localStorage
                localStorage.setItem('dataOriginal', JSON.stringify(data)); // Guardamos los datos
                localStorage.setItem('columnsOriginal', JSON.stringify(columns)); // Guardamos las columnas

                // Verificar los datos cargados
                console.log("Datos cargados:", data);

                // Actualizar la tabla y los filtros
                populateTable(data);
                populateFilterColumns();
            };

            reader.readAsArrayBuffer(file);
        }
    };
    input.click();
}



function populateTable(dataToPopulate) {
    const tableBody = document.querySelector("#data-table tbody");
    const tableHead = document.querySelector("#data-table thead");

    tableBody.innerHTML = ""; // Limpiar filas existentes
    tableHead.innerHTML = ""; // Limpiar encabezado actual

    // Agregar encabezado "Check" en la tabla
    const th = document.createElement("th");
    th.textContent = "CHECK"; // Nombre de la nueva columna
    tableHead.appendChild(th);

    // Crear encabezados dinámicos para las columnas del archivo Excel
    columns.forEach((col) => {
        const th = document.createElement("th");
        th.textContent = col; // Usamos el nombre de la columna como encabezado
        tableHead.appendChild(th);
    });

    // Llenar el cuerpo de la tabla con las filas de datos
    dataToPopulate.forEach((row, rowIndex) => {
        const tr = document.createElement("tr");

        // Asignar un ID único basado en el índice de la fila
        row.ID = `row-${rowIndex}`; // Generar un ID único para cada fila

        // Crear una celda con checkbox para la columna "Check"
        const tdCheck = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.rowIndex = rowIndex; // Asociamos el checkbox a la fila
        checkbox.onclick = function () {
            toggleRowSelection(rowIndex); // Seleccionar/desmarcar la fila
        };
        tdCheck.appendChild(checkbox);
        tr.appendChild(tdCheck);

        // Rellenar las celdas de la fila con los datos (todas las columnas del archivo Excel)
        columns.forEach((col) => {
            const td = document.createElement("td");
            td.textContent = row[col] || ""; // Mostrar el valor o vacío si no existe
            td.setAttribute('data-column', col); // Agregar el atributo data-column
            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    });
}



// 2. Código que se ejecuta al cargar la página

window.onload = function() {
    const storedData = localStorage.getItem('dataOriginal');
    const storedColumns = localStorage.getItem('columnsOriginal');
  
    // Si existen datos en localStorage, los cargamos
    if (storedData && storedColumns) {
      data = JSON.parse(storedData);
      columns = JSON.parse(storedColumns);
  
      // Llenar la tabla con los datos almacenados
      populateTable(data);
      populateFilterColumns();
      console.log("Datos cargados desde localStorage");
    } else {
      console.log("No se encontraron datos en localStorage");
    }
  };
  
  
  
  
  

function toggleRowSelection(index) {
    const row = data[index]; // Obtener los datos de la fila seleccionada
    const rowID = row.ID; // Obtener el "ID" asignado

    if (selectedItems.has(rowID)) {
        selectedItems.delete(rowID); // Si ya está seleccionada, la deseleccionamos
        console.log(`Fila deseleccionada: ${JSON.stringify(row)}`); // Imprimir fila deseleccionada
    } else {
        selectedItems.add(rowID); // Si no está seleccionada, la agregamos
        console.log(`Fila seleccionada: ${JSON.stringify(row)}`); // Imprimir fila seleccionada
    }

    console.log("Filas seleccionadas actualmente:", Array.from(selectedItems)); // Ver todas las filas seleccionadas
}





// Función para seleccionar todos los elementos
function toggleSelectAll() {
  const checkboxes = document.querySelectorAll(
    "#data-table tbody input[type='checkbox']"
  );
  if (checkboxes.length > 0) {
    const allSelected = Array.from(checkboxes).every(
      (checkbox) => checkbox.checked
    );
    checkboxes.forEach((checkbox) => (checkbox.checked = !allSelected));
    if (!allSelected) {
      // Agregar todos los IDs a selectedItems
      data.forEach((row) => selectedItems.add(row.ID));
    } else {
      selectedItems.clear();
    }
  }
}

// Función para generar QR
function generateQR() {
  if (selectedItems.size === 0) {
    alert("Por favor, selecciona al menos una fila.");
    return;
  }
  // Mostrar modal para seleccionar columnas del QR
  document.getElementById("qr-modal").style.display = "flex";
  const qrColumnOptions = document.getElementById("qr-column-options");
  qrColumnOptions.innerHTML = "";
  columns.slice(0).forEach((col) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = col;
    checkbox.value = col;
    const label = document.createElement("label");
    label.setAttribute("for", col);
    label.textContent = col;
    qrColumnOptions.appendChild(checkbox);
    qrColumnOptions.appendChild(label);
    qrColumnOptions.appendChild(document.createElement("br"));
  });
}

// Función para confirmar la selección de columnas para QR
function confirmQRSelection() {
    const checkboxes = document.querySelectorAll("#qr-column-options input:checked");
    columns = []; // Limpiamos la lista de columnas seleccionadas
    rows = []; // Limpiamos la lista de filas seleccionadas
  
    // Iteramos sobre los checkboxes seleccionados
    checkboxes.forEach((checkbox) => {
      columns.push(checkbox.value); // Agregamos las columnas seleccionadas
    });
  
    // Verificamos si al menos una columna fue seleccionada
    if (columns.length === 0) {
      alert("Por favor selecciona al menos una columna.");
    } else {
      // Iteramos sobre las filas seleccionadas
      const checkboxesSelected = document.querySelectorAll('#data-table tbody tr td:nth-child(1) input[type="checkbox"]:checked');
      
      console.log("Filas seleccionadas: ", checkboxesSelected); // Depuración: Verificar cuántas filas están seleccionadas

      checkboxesSelected.forEach(checkbox => {
        const parentRow = checkbox.parentNode.parentNode; // Obtener la fila padre de la casilla de verificación
        let rowData = {};

        // Iteramos sobre las columnas seleccionadas
        columns.forEach(col => {
          const cell = parentRow.querySelector(`td[data-column="${col}"]`);
          if (cell) {
            rowData[col] = cell.textContent || cell.innerText;
          }
        });

        if (Object.keys(rowData).length > 0) {
          rows.push(rowData); // Si la fila tiene datos, la agregamos
        }
      });
  
      // Verificamos si al menos una fila tiene datos
      if (rows.length === 0) {
        alert("No se encontraron filas para las columnas seleccionadas.");
      } else {
        console.log("Columnas seleccionadas para QR:", columns);
        console.log("Filas seleccionadas:", rows);
  
        // Guardamos las columnas y las filas en el localStorage
        const tableData = {
          columns: columns,
          rows: rows
        };
        localStorage.setItem('qrTableData', JSON.stringify(tableData));
  
        // Redirigir a la página newColumns.html
        window.location.href = 'newColumns.html'; // Cambia la ruta según sea necesario
      }
    }
}


  
  
  

// Cerrar modal
function closeQRModal() {
  document.getElementById("qr-modal").style.display = "none";
}


// Función para llenar las columnas del filtro
function populateFilterColumns() {
    const filterColumn = document.getElementById("filter-column");
    filterColumn.innerHTML = "<option value=''>Selecciona una columna</option>";
  
    // Llenar las opciones de las columnas del filtro (ahora incluyendo la primera columna)
    columns.forEach((col) => {
      const option = document.createElement("option");
      option.value = col;
      option.textContent = col;
      filterColumn.appendChild(option);
    });
  
    filterColumn.addEventListener("change", updateFilterValues);
}
  
// Función para actualizar los valores del filtro
function updateFilterValues() {
    const column = document.getElementById("filter-column").value;
    const filterValue = document.getElementById("filter-value");
    
    console.log("Columna seleccionada:", column);
    console.log("Datos disponibles:", data); // Verificar datos
    
    filterValue.innerHTML = "<option value=''>Selecciona un valor</option>";
    
    if (column && data.length > 0) {
        // Obtener valores únicos de la columna seleccionada
        const uniqueValues = [...new Set(
            data
            .map(row => row[column])
            .filter(value => value !== null && value !== undefined && value !== "")
            .map(value => value.toString().trim())
        )].sort();

        console.log("Valores únicos encontrados:", uniqueValues);

        // Agregar opciones al select
        uniqueValues.forEach(val => {
            const option = document.createElement("option");
            option.value = val;
            option.textContent = val;
            filterValue.appendChild(option);
        });
    }
}
  
// Función para aplicar el filtro
function applyFilter() {
    const column = document.getElementById("filter-column").value;
    const value = document.getElementById("filter-value").value;
    
    if (!column || !value) {
        alert("Por favor, selecciona una columna y un valor.");
        return;
    }

    filteredData = data.filter(row => {
        const rowValue = row[column];
        return rowValue !== null && 
               rowValue !== undefined && 
               rowValue.toString().toLowerCase().includes(value.toLowerCase());
    });

    console.log("Datos filtrados:", filteredData);
    populateTable(filteredData);
}


// Función para limpiar los filtros y mostrar todos los datos
function clearFilters() {
    // Restablecer los datos filtrados a todos los datos
    filteredData = [...data]; // Esto asegura que todos los datos se mantengan, incluso si están filtrados previamente

    // Limpiar los valores del filtro (opcional si quieres limpiar también la interfaz)
    document.getElementById("filter-column").value = "";
    document.getElementById("filter-value").innerHTML = "<option value=''>Selecciona un valor</option>";

    // Llenar la tabla con todos los datos
    populateTable(filteredData);

    console.log("Filtros limpiados. Mostrando todos los datos.");
}

  
