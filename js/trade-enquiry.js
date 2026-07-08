/* Factory Finish — trade enquiry form → Supabase + optional WhatsApp */

(() => {
  "use strict";

  const SUPABASE_URL = "https://xflljearjaiwcjortoam.supabase.co";
  const SUPABASE_KEY = "sb_publishable_hmGo4sXrYgPk3R_AY05aMA_8-qGGCJl";
  const WHATSAPP_NUMBER = "447740011033";

  const form = document.getElementById("tradeForm");
  const submitBtn = document.getElementById("tradeSubmit");
  if (!form || !submitBtn || !window.supabase) return;

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const val = (id) => document.getElementById(id)?.value.trim() ?? "";

  const buildWhatsAppMessage = (data) => {
    let text = "Good Day Factory F, we are considering using your services and are willing to have a discussion. Our details and scope of work are below…\n\n";
    text += `Company Name: ${data.company_name}\n`;
    text += `Postcode: ${data.postcode}\n`;
    text += `Business Type: ${data.business_type}\n`;
    text += `Commitment: ${data.commitment}\n`;
    text += `Est Wheels Per Week: ${data.est_wheels_per_week}\n`;
    text += `Contact Number: ${data.contact_number}\n`;
    text += `Email Address: ${data.email}\n\n`;
    text += "Please reach out to discuss";
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
      company_name: val("companyName"),
      postcode: val("postcode"),
      business_type: val("businessType"),
      commitment: val("commitment"),
      est_wheels_per_week: val("estWheelsPerWeek"),
      contact_number: val("contactNumber"),
      email: val("email"),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const payload = {
      company_name: data.company_name,
      postcode: data.postcode || null,
      business_type: data.business_type || null,
      commitment: data.commitment || null,
      est_wheels_per_week: data.est_wheels_per_week || null,
      contact_number: data.contact_number,
      email: data.email || null,
      source_page: document.title,
    };

    try {
      const { error } = await supabase.from("trade_leads").insert(payload);
      if (error) console.error("Supabase insert failed:", error);
    } catch (err) {
      console.error("Supabase insert failed:", err);
    }

    showConfirmation(data);
  });
})();
