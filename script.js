(function () {
    // === (1) TUS REFERENCIAS ORIGINALES (sin cambios de lógica) ===
    const ENDPOINT = "https://aretha-unstrict-vicky.ngrok-free.dev/api/facturacion";
    const form = document.getElementById('billing-form');
    const out  = document.getElementById('json-preview');
    const btn  = form.querySelector('button[type="submit"]');

    // === (2) NUEVO: referencias al modal ===
    const overlay    = document.getElementById('confirm-overlay');
    const dialog     = document.getElementById('confirm-dialog');
    const btnReview  = document.getElementById('btn-review');
    const btnConfirm = document.getElementById('btn-confirm');

    // Si ya fue enviado en esta sesión, muestra pantalla de éxito y bloquea regreso
    if (sessionStorage.getItem('billingSubmitted') === '1') {
        renderSuccessAndLock();
    }

    // === (3) INTERCEPCIÓN SUAVE: ahora el submit sólo abre el modal ===
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        openDialog();
    });

    // Botón "Quiero revisarlos nuevamente"
    if (btnReview) btnReview.addEventListener('click', closeDialog);

    // Botón "Sí, estoy seguro" → ejecuta EL MISMO envío que ya tenías
    if (btnConfirm) btnConfirm.addEventListener('click', async function () {
        closeDialog();
        await performSubmitJSON(); // usa tu fetch JSON con CORS
    });

    // === (4) FUNCIÓN QUE CONTIENE TU LÓGICA ORIGINAL DE ENVÍO (JSON) ===
    async function performSubmitJSON() {
        const payload = {
        rfc:                 document.getElementById('rfc').value.trim().toUpperCase(),
        correo_electronico:  document.getElementById('email').value.trim(),
        codigo_postal:       document.getElementById('cp').value.trim(),
        usoCFDI:            (document.getElementById('CFDIuse').value || '').trim() || null,
        razon_social:        document.getElementById('rSocial').value.trim(),
        regimen_fiscal:      document.getElementById('regime').value.trim(),
        forma_pago:          document.getElementById('paymentMethod').value.trim(),
        };

        const body = JSON.stringify(payload, null, 2);
        if (out) out.textContent = body;

        // UI: deshabilitar botón durante el envío
        btn.disabled = true; btn.textContent = "Enviando…";

        try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            mode: 'cors', // importante para CORS
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status}: ${text}`);
        }

        // Si la API responde JSON, opcionalmente léelo; si no, ignora
        await res.json().catch(() => ({}));

        // ÉXITO → reemplaza el formulario y bloquea el historial
        renderSuccessAndLock();
        sessionStorage.setItem('billingSubmitted', '1');

        // Sin alertas; si quieres, aquí podrías inyectar un aviso inline
        // showInlineMessage('success', 'Datos enviados correctamente.');

        } catch (err) {
        // No mostrar alertas (requisito). Deja registro para depurar.
        console.error('Error al enviar:', err);
        // showInlineMessage('error', 'No se pudo enviar. Intenta de nuevo.');
        } finally {
        // Si hubo éxito, el botón ya no existe; si falló, reactivar
        if (document.body.contains(btn)) {
            btn.disabled = false; btn.textContent = "Enviar datos de facturación";
        }
        }
    }

    // === (5) UI AUXILIAR: modal y post-éxito ===
    function openDialog() {
        if (!overlay || !dialog) return;
        overlay.classList.remove('hidden');
        dialog.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');
    }
    function closeDialog() {
        if (!overlay || !dialog) return;
        dialog.classList.add('hidden');
        overlay.classList.add('hidden');
        overlay.setAttribute('aria-hidden', 'true');
    }

    function renderSuccessAndLock() {
        const main = document.querySelector('main') || document.body;
        if (main) {
            main.style.minHeight    = '100dvh';
            main.style.display      = 'grid';
            main.style.placeItems   = 'center';   // centra cada ítem
            main.style.placeContent = 'center';   // centra el conjunto de filas/columnas
            main.style.gap          = '16px';
            main.style.padding      = '24px';

            main.innerHTML = `
            <a href="https://www.insetti.com.mx/" aria-label="Ir a insetti.com.mx">
                <img src="./images/logo.webp" alt="Insetti" style="width:180px;height:auto" />
            </a>
            <section class="card" aria-live="polite" style="width:min(760px,92vw);">
                <h1>Envío realizado con éxito</h1>
                <p>Tu información se envió correctamente, muchas gracias por tu compra</p>
            </section>
            `;
        }

        // Mitigar navegación hacia atrás en esta pestaña
        try {
            history.pushState(null, '', location.href);
            window.addEventListener('popstate', () => history.go(1));
            history.replaceState(null, '', location.href);
        } catch (_) { /* no-op */ }
    }


    // (Opcional) mensaje inline simple; desactivado por defecto
    function showInlineMessage(kind, text) {
        let box = document.getElementById('form-note');
        if (!box) {
        box = document.createElement('div');
        box.id = 'form-note';
        box.style.marginTop = '12px';
        form.appendChild(box);
        }
        box.textContent = text;
        box.style.color = (kind === 'error') ? '#b91c1c' : '#0f766e';
    }
})();
