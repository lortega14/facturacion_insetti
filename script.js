(function () {
    const ENDPOINT = "https://aretha-unstrict-vicky.ngrok-free.dev/api/facturacion";
    const form = document.getElementById('billing-form');
    const out  = document.getElementById('json-preview');
    const btn  = form.querySelector('button[type="submit"]');

    const overlay    = document.getElementById('confirm-overlay');
    const dialog     = document.getElementById('confirm-dialog');
    const btnReview  = document.getElementById('btn-review');
    const btnConfirm = document.getElementById('btn-confirm');

    const urlParams = new URLSearchParams(window.location.search);
    const orderIdFromUrl = urlParams.get('order_id');

    const buyerIdFromUrl = urlParams.get('buyer_id') || null;
    const itemTitle      = urlParams.get('item');
    const itemQty        = urlParams.get('qty');
    const itemPrice      = urlParams.get('price');

    const esIdValido = orderIdFromUrl && /^\d{16,}$/.test(orderIdFromUrl);

    if (!esIdValido) {
        const main = document.querySelector('main') || document.body;
        main.innerHTML = `
            <a href="https://www.insetti.com.mx/" aria-label="Ir a insetti.com.mx">
                <img src="./images/logo.webp" alt="Insetti" style="width:180px;height:auto" />
            </a>
            <section class="card" style="text-align: center; padding: 40px;">
                <h1 style="color: #dc2626; margin-bottom: 1rem;">Acceso no válido 🚫</h1>
                <p>No se ha detectado una orden para facturar.</p>
                <p style="color: #64748b;">Por favor utiliza el enlace temporal enviado a tu mensajería de Mercado Libre.</p>
            </section>
        `;
        return;
    }

    if (itemTitle) {
        const summaryCard = document.getElementById('order-summary');
        const lblItem     = document.getElementById('lbl-item');
        const lblQty      = document.getElementById('lbl-qty');
        const lblTotal    = document.getElementById('lbl-total');

        if (summaryCard) {
            summaryCard.classList.remove('hidden'); // Mostrar la tarjeta
            
            lblItem.textContent = itemTitle;
            lblQty.textContent  = itemQty;
            
            // Formatear precio a moneda
            const total = parseFloat(itemPrice) * parseFloat(itemQty);
            const formatter = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN'
            });
            lblTotal.textContent = !isNaN(total) ? formatter.format(total) : `$${itemPrice}`;
        }
    }
    
    if (sessionStorage.getItem('billingSubmitted') === '1') {
        renderSuccessAndLock();
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        openDialog();
    });

    const rfcInput = document.getElementById('rfc');
    if(rfcInput){
        const toUpperLive = (e) => {
            const el = e.target;
            const { selectionStart, selectionEnd, value } = el;
            const upper = value.toUpperCase();
            if (value !== upper) {
                el.value = upper;
                if(selectionStart !== null && selectionEnd !== null) {
                    el.setSelectionRange(selectionStart, selectionEnd);
                }
            }
        };
        rfcInput.addEventListener('input', toUpperLive);
    }

    if (btnReview) btnReview.addEventListener('click', closeDialog);

    if (btnConfirm) btnConfirm.addEventListener('click', async function () {
        closeDialog();
        await performSubmitJSON();
    });

    async function performSubmitJSON() {
        const payload = {
            order_id:           orderIdFromUrl,
            buyer_id:          buyerIdFromUrl,
            rfc:                 document.getElementById('rfc').value.trim().toUpperCase(),
            correo_electronico:  document.getElementById('email').value.trim(),
            codigo_postal:       document.getElementById('cp').value.trim(),
            usoCFDI:            (document.getElementById('CFDIuse').value || '').trim() || null,
            razon_social:        document.getElementById('rSocial').value.trim(),
            regimen_fiscal:     (document.getElementById('regime').value || '').trim() || null,
            forma_pago:         (document.getElementById('paymentMethod').value || '').trim() || null,
        };

        const body = JSON.stringify(payload, null, 2);
        if (out) out.textContent = body;

        btn.disabled = true;

        try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`HTTP ${res.status}: ${text}`);
        }

        await res.json().catch(() => ({}));

        renderSuccessAndLock();
        sessionStorage.setItem('billingSubmitted', '1');
        } catch (err) {
        console.error('Error al enviar:', err);
        } finally {
        if (document.body.contains(btn)) {
            btn.disabled = false;
        }
        }
    }

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
            main.style.placeItems   = 'center';
            main.style.placeContent = 'center';
            main.style.gap          = '16px';
            main.style.padding      = '24px';

            main.innerHTML = `
            <a href="https://www.insetti.com.mx/" aria-label="Ir a insetti.com.mx">
                <img src="./images/logo.webp" alt="Insetti" style="width:180px;height:auto" />
            </a>
            <section class="card" aria-live="polite" style="width:min(760px,92vw);">
                <h1>Envío realizado con éxito</h1>
                <p>Tu información se envió correctamente, muchas gracias por tu compra.</p>
                <p>¡Enviaremos tu factura a tu correo electrónico!</p>
            </section>
            `;
        }

        try {
            history.pushState(null, '', location.href);
            window.addEventListener('popstate', () => history.go(1));
            history.replaceState(null, '', location.href);
        } catch (_) { /* no-op */ }
    }

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
