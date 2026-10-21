/* Factory Finish — enquiry photo/video picker and private bucket upload */

(() => {
  "use strict";

  const BUCKET = "lead-media";
  const MAX_FILES = 6;
  const MAX_BYTES = 50 * 1024 * 1024;
  const MAX_EDGE = 2000;
  const JPEG_QUALITY = 0.8;

  const ALLOWED = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "video/mp4",
    "video/quicktime",
  ]);

  const EXT_TYPE = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    mp4: "video/mp4",
    mov: "video/quicktime",
  };

  const canonicalType = (file) => {
    const mime = (file.type || "").toLowerCase();
    if (mime === "image/jpg" || mime === "image/pjpeg") return "image/jpeg";
    if (ALLOWED.has(mime)) return mime;
    if (!mime || mime === "application/octet-stream") {
      const ext = extension(file.name);
      return EXT_TYPE[ext] || "";
    }
    return "";
  };

  const extension = (name) => {
    const base = String(name || "").split(/[/\\]/).pop() || "";
    const dot = base.lastIndexOf(".");
    return dot >= 0 ? base.slice(dot + 1).toLowerCase() : "";
  };

  const safeFilename = (name) => {
    const base = String(name || "file").split(/[/\\]/).pop();
    const cleaned = base
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .replace(/-\./g, ".")
      .slice(0, 80);
    return cleaned || "file";
  };

  const rejectionReason = (file) => {
    if (!canonicalType(file)) {
      return `${file.name} isn’t a supported file type. Use JPG, PNG, WEBP, HEIC, MP4 or MOV.`;
    }
    if (file.size > MAX_BYTES) {
      return `${file.name} is too large. Each file must be 50 MB or smaller.`;
    }
    return "";
  };

  const loadBitmap = async (file) => {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      return createImageBitmap(file);
    }
  };

  const resizeImage = async (file) => {
    const type = canonicalType(file);
    if (!type.startsWith("image/")) return file;

    let bitmap;
    try {
      bitmap = await loadBitmap(file);
    } catch (err) {
      console.warn("Could not resize image, uploading original:", err);
      return file;
    }

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("Could not encode JPEG"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    });

    const alreadySmallJpeg = type === "image/jpeg" && scale === 1 && blob.size >= file.size;
    if (alreadySmallJpeg) return file;

    const stem = safeFilename(file.name).replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${stem}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  };

  const showError = (el, message) => {
    if (!el) return;
    if (!message) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = message;
  };

  const bind = ({ input, camera, list, error, count }) => {
    const items = [];
    let busy = false;

    const setCount = () => {
      if (!count) return;
      if (!items.length) {
        count.hidden = true;
        count.textContent = "";
        return;
      }
      count.hidden = false;
      count.textContent = `${items.length} of ${MAX_FILES} added`;
    };

    const render = () => {
      list.replaceChildren();
      items.forEach((item) => {
        const li = document.createElement("li");
        li.className = "media-picker__item";

        const thumb = document.createElement("div");
        thumb.className = "media-picker__thumb";

        const type = canonicalType(item.file);
        if (type.startsWith("video/")) {
          const video = document.createElement("video");
          video.muted = true;
          video.defaultMuted = true;
          video.playsInline = true;
          video.preload = "metadata";
          video.tabIndex = -1;
          video.setAttribute("aria-hidden", "true");
          video.src = item.url;
          thumb.append(video);
          const badge = document.createElement("span");
          badge.className = "media-picker__badge";
          badge.textContent = "Video";
          thumb.append(badge);
        } else {
          const img = document.createElement("img");
          img.alt = "";
          img.src = item.url;
          img.addEventListener("error", () => {
            img.remove();
            const fallback = document.createElement("span");
            fallback.className = "media-picker__fallback";
            fallback.textContent = (extension(item.file.name) || "file").toUpperCase();
            thumb.prepend(fallback);
          });
          thumb.append(img);
        }

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "media-picker__remove";
        remove.setAttribute("aria-label", `Remove ${item.file.name}`);
        remove.textContent = "×";
        remove.addEventListener("click", () => {
          if (busy) return;
          URL.revokeObjectURL(item.url);
          const index = items.indexOf(item);
          if (index >= 0) items.splice(index, 1);
          showError(error, "");
          render();
        });

        const name = document.createElement("span");
        name.className = "media-picker__name";
        name.textContent = item.file.name;

        thumb.append(remove);
        li.append(thumb, name);
        list.append(li);
      });
      setCount();
    };

    const addFiles = (fileList) => {
      if (busy) return;
      const picked = Array.from(fileList || []);
      if (!picked.length) return;

      const problems = [];
      let hitLimit = false;
      picked.forEach((file) => {
        if (items.length >= MAX_FILES) {
          hitLimit = true;
          return;
        }
        const reason = rejectionReason(file);
        if (reason) {
          problems.push(reason);
          return;
        }
        items.push({
          file,
          url: URL.createObjectURL(file),
        });
      });
      if (hitLimit) problems.push("You can add up to 6 photos or videos.");

      showError(error, problems.join(" "));
      render();
    };

    const onPick = (event) => {
      const chosen = Array.from(event.target.files || []);
      event.target.value = "";
      addFiles(chosen);
    };

    input?.addEventListener("change", onPick);
    camera?.addEventListener("change", onPick);

    return {
      files: () => items.map((item) => item.file),
      setBusy: (value) => {
        busy = value;
        if (input) input.disabled = value;
        if (camera) camera.disabled = value;
      },
      release: () => {
        items.forEach((item) => URL.revokeObjectURL(item.url));
      },
    };
  };

  const storedPath = (objectPath, dataPath) => {
    const path = (dataPath || objectPath || "").replace(/^\/+/, "");
    if (!path) return objectPath;
    if (path.startsWith(`${BUCKET}/`)) return path;
    return `${BUCKET}/${path}`;
  };

  const uploadFiles = async (supabase, leadId, files, onProgress) => {
    const paths = [];
    const total = files.length;
    if (!total) return paths;

    try {
      const hasImage = files.some((file) => canonicalType(file).startsWith("image/"));
      if (hasImage) {
        onProgress?.({ phase: "prepare", current: 0, completed: 0, total });
      }

      const prepared = [];
      for (const file of files) {
        try {
          prepared.push(await resizeImage(file));
        } catch (err) {
          console.warn("Image resize failed, uploading original:", err);
          prepared.push(file);
        }
      }

      for (let index = 0; index < prepared.length; index += 1) {
        const file = prepared[index];
        const current = index + 1;
        onProgress?.({ phase: "upload", current, completed: index, total });

        const contentType = canonicalType(file) || file.type || "application/octet-stream";
        if (!ALLOWED.has(contentType)) {
          console.error("Skipping file with unsupported type:", file.name, contentType);
          onProgress?.({ phase: "upload", current, completed: current, total });
          continue;
        }

        const objectPath = `${leadId}/${current}-${safeFilename(file.name)}`;
        try {
          const { data, error } = await supabase.storage.from(BUCKET).upload(objectPath, file, {
            contentType,
            cacheControl: "3600",
            upsert: false,
          });
          if (error) throw error;
          paths.push(storedPath(objectPath, data?.path));
        } catch (err) {
          console.error("Lead media upload failed:", err);
        }
        onProgress?.({ phase: "upload", current, completed: current, total });
      }
    } catch (err) {
      console.error("Lead media upload failed:", err);
    }

    return paths;
  };

  const renderProgress = (els, state) => {
    if (!els?.root) return;
    els.root.hidden = false;
    const preparing = state.phase === "prepare";
    const pct = !preparing && state.total ? Math.round((state.completed / state.total) * 100) : 0;
    if (els.bar) {
      els.bar.classList.toggle("is-indeterminate", preparing);
      els.bar.style.width = preparing ? "" : `${pct}%`;
    }
    if (els.track) els.track.setAttribute("aria-valuenow", String(pct));
    const label = preparing
      ? "Preparing photos…"
      : `Uploading ${state.current} of ${state.total}…`;
    if (els.text) els.text.textContent = label;
    if (els.button) els.button.textContent = label;
  };

  window.FFLeadMedia = { bind, uploadFiles, renderProgress, rejectionReason };
})();
