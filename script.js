(function () {
  "use strict";

  /* ---------- State ---------- */
  let selectedBusiness = "general";

  /* ---------- DOM refs ---------- */
  const bizButtons = Array.from(document.querySelectorAll(".biz-btn"));
  const form = document.getElementById("message-form");
  const emptyState = document.getElementById("empty-state");
  const thread = document.getElementById("messages-thread");
  const resultsList = document.getElementById("results-list");

  /* ---------- Business type selection ---------- */
  bizButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      bizButtons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-checked", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-checked", "true");
      selectedBusiness = btn.dataset.value;
    });
  });
  // default: general selected
  const defaultBtn = bizButtons.find((b) => b.dataset.value === "general");
  if (defaultBtn) {
    defaultBtn.classList.add("active");
    defaultBtn.setAttribute("aria-checked", "true");
  }

  /* ---------- Helpers ---------- */
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function toPersianDigits(str) {
    const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return String(str).replace(/[0-9]/g, (d) => fa[+d]);
  }

  function formatPrice(raw) {
    if (!raw) return "";
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) return raw.trim();
    const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return toPersianDigits(withCommas) + " تومان";
  }

  function currentTime() {
    const d = new Date();
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return toPersianDigits(`${h}:${m}`);
  }

  /* ---------- Vocabulary per business type ---------- */
  const BIZ = {
    gym: {
      label: "باشگاه",
      noun: "جلسه",
      place: "باشگاه",
      icon: "🏋️",
    },
    salon: {
      label: "آرایشگاه",
      noun: "نوبت",
      place: "سالن",
      icon: "💇",
    },
    clinic: {
      label: "کلینیک",
      noun: "نوبت",
      place: "کلینیک",
      icon: "🩺",
    },
    realestate: {
      label: "مشاور املاک",
      noun: "بازدید",
      place: "دفتر",
      icon: "🏠",
    },
    general: {
      label: "کسب‌وکار",
      noun: "وقت",
      place: "مجموعه",
      icon: "💼",
    },
  };

  /* ---------- Message builders ---------- */

  function greeting(name, tone) {
    if (!name) {
      return tone === "formal" ? "سلام، وقت بخیر." : "سلام 🙂";
    }
    if (tone === "formal") return `سلام ${name} عزیز، وقت بخیر.`;
    if (tone === "brief") return `سلام ${name}،`;
    return `سلام ${name} جان 🙂`;
  }

  function buildInitialReply(d) {
    const biz = BIZ[d.business];
    const g = greeting(d.customerName, d.tone);
    const serviceText = d.service || "خدمات ما";
    const priceText = d.price ? ` هزینه‌ی ${d.service ? "این خدمت" : "آن"} ${d.price} است.` : "";

    let ackParts;
    if (d.customerMessage) {
      ackParts = {
        formal: `پیام شما دریافت شد و از اینکه ${biz.place} ما را انتخاب کرده‌اید سپاسگزاریم.`,
        friendly: `پیامت رو دیدم، خوشحالم که به ما سر زدی!`,
        brief: `پیامتون رسید.`,
      };
    } else {
      ackParts = {
        formal: `از تماس شما با ${biz.place} ما سپاسگزاریم.`,
        friendly: `خیلی خوشحالیم که با ما در تماسی 🙌`,
        brief: `ممنون از پیامتون.`,
      };
    }

    const infoParts = {
      formal: `در خصوص «${serviceText}» باید عرض کنم${priceText ? priceText : " در حال حاضر امکان ارائه‌ی این خدمت وجود دارد."} برای هماهنگی زمان مناسب، لطفاً بفرمایید چه روزی برایتان راحت‌تر است.`,
      friendly: `درباره‌ی «${serviceText}»${priceText ? priceText : " کلی گزینه خوب براتون داریم."} فقط بگو کِی وقت داری تا هماهنگ کنیم!`,
      brief: `«${serviceText}»${priceText ? "، " + d.price : ""}. بفرمایید چه زمانی مناسبه.`,
    };

    const closing = {
      formal: `منتظر پاسخ شما هستیم.`,
      friendly: `منتظرتم 🌿`,
      brief: `در خدمتم.`,
    };

    return [g, ackParts[d.tone], infoParts[d.tone], closing[d.tone]].filter(Boolean).join("\n\n");
  }

  function buildFollowUp(d) {
    const biz = BIZ[d.business];
    const g = greeting(d.customerName, d.tone);
    const serviceText = d.service || "خدمتی که صحبت کرده بودیم";

    const bodies = {
      formal: [
        `می‌خواستم پیگیر موضوع «${serviceText}» باشم؛ آیا هنوز مورد نظرتان است؟`,
        `در تداوم مکالمه‌ی قبلی، در خصوص «${serviceText}» پیگیر وضعیت تصمیم شما هستم.`,
      ],
      friendly: [
        `فقط یه سر زدم ببینم درباره‌ی «${serviceText}» به جمع‌بندی رسیدی یا نه 😊`,
        `یادت نره‌ها! هنوز جای «${serviceText}» برات باز نگه داشتیم.`,
      ],
      brief: [
        `پیگیری «${serviceText}» — هنوز مدنظرتونه؟`,
        `فقط یادآوری: «${serviceText}» هنوز آماده‌ست.`,
      ],
    };

    const closing = {
      formal: `در صورت تمایل، خوشحال می‌شویم زمان مناسب را هماهنگ کنیم.`,
      friendly: `هر وقت آماده بودی خبر بده، هماهنگ می‌کنیم 🌿`,
      brief: `منتظر جوابتونم.`,
    };

    return [g, pick(bodies[d.tone]), closing[d.tone]].filter(Boolean).join("\n\n");
  }

  function buildReminder(d) {
    const biz = BIZ[d.business];
    const g = greeting(d.customerName, d.tone);
    const serviceText = d.service || biz.noun;
    const priceLine = d.price ? ` مبلغ قابل پرداخت ${d.price} است.` : "";

    const bodies = {
      formal: `این پیام یادآوری ${biz.noun}‌ شما برای «${serviceText}» است.${priceLine} خواهشمندیم در صورت نیاز به تغییر زمان، از قبل اطلاع دهید.`,
      friendly: `یه یادآوری کوچیک برای ${biz.noun}‌ت با موضوع «${serviceText}»!${priceLine} اگه لازم شد جابه‌جا کنیم بگو 🙌`,
      brief: `یادآوری: ${biz.noun} «${serviceText}».${priceLine}`,
    };

    const closing = {
      formal: `از همراهی شما سپاسگزاریم.`,
      friendly: `می‌بینمت! 🌿`,
      brief: `ممنون.`,
    };

    return [g, bodies[d.tone], closing[d.tone]].filter(Boolean).join("\n\n");
  }

  /* ---------- Rendering ---------- */
  function renderBubble(kind, label, text) {
    const wrap = document.createElement("div");
    wrap.className = "bubble-wrap";
    wrap.dataset.kind = kind;

    const lbl = document.createElement("div");
    lbl.className = "bubble-label";
    lbl.textContent = label;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    const meta = document.createElement("div");
    meta.className = "bubble-meta";
    meta.innerHTML = `<span>${currentTime()}</span><span class="ticks">✓✓</span>`;

    wrap.appendChild(lbl);
    wrap.appendChild(bubble);
    wrap.appendChild(meta);
    return wrap;
  }

  function renderResultCard(kind, title, text) {
    const card = document.createElement("div");
    card.className = "result-card";
    card.dataset.kind = kind;

    const head = document.createElement("div");
    head.className = "result-head";

    const titleEl = document.createElement("div");
    titleEl.className = "result-title";
    titleEl.innerHTML = `<span class="dot"></span><span>${title}</span>`;

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "copy-btn";
    copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" class="copy-icon"><path d="M9 9h10v10H9zM5 15V5h10" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>
      <span>کپی</span>`;

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      copyBtn.classList.add("copied");
      copyBtn.querySelector("span").textContent = "کپی شد";
      setTimeout(() => {
        copyBtn.classList.remove("copied");
        copyBtn.querySelector("span").textContent = "کپی";
      }, 1600);
    });

    head.appendChild(titleEl);
    head.appendChild(copyBtn);

    const p = document.createElement("p");
    p.className = "result-text";
    p.textContent = text;

    card.appendChild(head);
    card.appendChild(p);
    return card;
  }

  /* ---------- Form submit ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = {
      customerName: document.getElementById("customer-name").value.trim(),
      business: selectedBusiness,
      service: document.getElementById("service").value.trim(),
      price: formatPrice(document.getElementById("price").value.trim()),
      customerMessage: document.getElementById("customer-message").value.trim(),
      tone: document.getElementById("tone").value,
    };

    const messages = [
      { kind: "initial", label: "پاسخ اولیه", text: buildInitialReply(data) },
      { kind: "followup", label: "پیام پیگیری", text: buildFollowUp(data) },
      { kind: "reminder", label: "یادآوری رزرو / پرداخت", text: buildReminder(data) },
    ];

    // Render phone preview
    emptyState.hidden = true;
    thread.hidden = false;
    thread.innerHTML = "";
    messages.forEach((m) => thread.appendChild(renderBubble(m.kind, m.label, m.text)));

    // Render copyable cards
    resultsList.hidden = false;
    resultsList.innerHTML = "";
    messages.forEach((m) => resultsList.appendChild(renderResultCard(m.kind, m.label, m.text)));

    document.getElementById("phone-frame").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
})();
