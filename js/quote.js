/* Factory Finish — quote form → Supabase + optional WhatsApp */

(() => {
  "use strict";

  const SUPABASE_URL = "https://xflljearjaiwcjortoam.supabase.co";
  const SUPABASE_KEY = "sb_publishable_hmGo4sXrYgPk3R_AY05aMA_8-qGGCJl";
  const WHATSAPP_NUMBER = "447740011033";

  const form = document.getElementById("quoteForm");
  const submitBtn = document.getElementById("quoteSubmit");
  if (!form || !submitBtn || !window.supabase) return;

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const val = (id) => document.getElementById(id)?.value.trim() ?? "";

  const buildWhatsAppMessage = (data) => {
    let text = "Hi Factory F, I'd like a quote, please see below my details…\n\n";
    text += `Car Reg: ${data.car_reg}\n`;
    text += `Postcode: ${data.postcode}\n`;
    text += `Wheel size: ${data.wheel_size}\n`;
    text += `Contact Number: ${data.phone}\n`;
    text += `Email Address: ${data.email}\n`;
    text += `Request: ${data.service_type}`;
    if (data.message) text += `\n${data.message}`;
    text += "\n\n*** Customer please send / attach pictures of wheels so we can assess and quote accurately ***";
    return text;
  };

  const whatsAppUrl = (data) =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(data))}`;

  const showConfirmation = (data) => {
    const waUrl = whatsAppUrl(data);
    form.outerHTML = `
      <div class="form-confirm" role="status" aria-live="polite">
        <div class="form-confirm__icon" aria-hidden="true">✓</div>
        <h2 class="form-confirm__title">Enquiry received</h2>
        <p class="form-confirm__lead">Thanks — we've received your enquiry and will be in touch shortly.</p>
        <p class="form-confirm__hint">You can also send your enquiry direct to WhatsApp for added urgency.</p>
        <a class="btn btn--ghost form-confirm__whatsapp" href="${waUrl}" target="_blank" rel="noopener noreferrer">Continue to WhatsApp</a>
      </div>`;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    const data = {
      full_name: val("fullName"),
      phone: val("phone"),
      email: val("email"),
      car_reg: val("carReg"),
      postcode: val("postcode"),
      wheel_size: val("wheelSize"),
      service_type: val("serviceType"),
      message: val("message"),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const payload = {
      full_name: data.full_name,
      phone: data.phone,
      email: data.email || null,
      car_reg: data.car_reg || null,
      postcode: data.postcode,
      wheel_size: data.wheel_size || null,
      service_type: data.service_type || null,
      message: data.message || null,
      source_page: document.title,
    };

    try {
      const { error } = await supabase.from("quote_leads").insert(payload);
      if (error) console.error("Supabase insert failed:", error);
    } catch (err) {
      console.error("Supabase insert failed:", err);
    }

    showConfirmation(data);
  });
})();
