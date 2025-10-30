
(function () {
    const ENDPOINT = "https://aretha-unstrict-vicky.ngrok-free.dev/api/facturacion"; // <-- AJUSTA la ruta
    const form = document.getElementById('billing-form');
    const out  = document.getElementById('json-preview');
    const btn  = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const payload = {
        nombre:           document.getElementById('nombre').value.trim(),
        apellido_paterno: document.getElementById('apaterno').value.trim(),
        apellido_materno: (document.getElementById('amaterno').value || '').trim() || null,
        rfc:              document.getElementById('rfc').value.trim().toUpperCase(),
        razon_social:     (document.getElementById('razon').value || '').trim() || null,
        domicilio:        document.getElementById('domicilio').value.trim(),
        codigo_postal:    document.getElementById('cp').value.trim()
    };

    const body = JSON.stringify(payload, null, 2);
    if (out) out.textContent = body;

    // UI: deshabilitar botón durante el envío
    btn.disabled = true; btn.textContent = "Enviando…";

    try {
        const res = await fetch(ENDPOINT, {
        method: 'POST',
        mode: 'cors', // importante para CORS
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
        });

        if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const data = await res.json().catch(() => ({}));
        console.log('Respuesta servidor:', data);
        alert('Enviado correctamente.');
    } catch (err) {
        console.error(err);
        alert('Error al enviar: ' + err.message);
    } finally {
        btn.disabled = false; btn.textContent = "Enviar datos de facturación";
    }
    });
})();