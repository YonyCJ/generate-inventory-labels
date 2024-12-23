// Credenciales estáticas
const USUARIO_ESTATICO = "admin";
const CONTRASENA_ESTATICA = "1234";

// Capturar el formulario
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault(); // Evitar el envío del formulario

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Validar campos vacíos
  if (!email || !password) {
    alert("Por favor, complete todos los campos.");
    return;
  }

  // Validar credenciales
  if (email === USUARIO_ESTATICO && password === CONTRASENA_ESTATICA) {
    alert("Acceso concedido. Redirigiendo al dashboard...");
    window.location.href = "dashboard.html"; // Redirige al dashboard
  } else {
    alert("Usuario o contraseña incorrectos.");
  }
});

// Opcional: Acciones para los botones de Google y Facebook
document.getElementById("googleLogin").addEventListener("click", function () {
  alert("Redirigiendo a Google Login...");
});

document.getElementById("facebookLogin").addEventListener("click", function () {
  alert("Redirigiendo a Facebook Login...");
});
