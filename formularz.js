
window.GEOCODE_URL = window.GEOCODE_URL || "https://xlcjmhhaxjnizmpoqkoa.supabase.co/functions/v1/geocode";
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("event-form");
  if (!form) return;

  const locationInput = document.getElementById("location");
  const suggestionsEl = document.getElementById("location-suggestions");
  const locationError = document.getElementById("location-error");
  const statusEl = document.getElementById("form-status");
  const submitButton = document.getElementById("submit-button");
  const startDate = document.getElementById("start_date");
  const endDate = document.getElementById("end_date");

const supabase =
  window.supabaseClient ??
  (typeof supabaseClient !== "undefined"
    ? supabaseClient
    : null);
  const geocodeUrl = window.GEOCODE_URL;

  let chosenPlace = null;
  let debounceTimer = null;
  let requestController = null;
  let currentSuggestions = [];

  endDate.min = startDate.value || "";
  startDate.addEventListener("change", () => {
    endDate.min = startDate.value || "";
    if (endDate.value && startDate.value && endDate.value < startDate.value) {
      endDate.value = startDate.value;
    }
  });

  function setLocationError(message) {
    locationError.textContent = message || "";
    locationError.hidden = !message;
  }

  function closeSuggestions() {
    suggestionsEl.hidden = true;
    suggestionsEl.replaceChildren();
    locationInput.setAttribute("aria-expanded", "false");
    currentSuggestions = [];
  }

  function getDisplayName(place) {
    return place.display_name || place.name || place.label ||
      [place.address, place.city, place.country].filter(Boolean).join(", ");
  }

  function renderSuggestions(places) {
    closeSuggestions();
    currentSuggestions = places.slice(0, 6);
    if (!currentSuggestions.length) return;

    currentSuggestions.forEach((place, index) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("tabindex", "0");
      li.setAttribute("aria-selected", "false");
      li.textContent = getDisplayName(place);
      const choose = () => choosePlace(place);
      li.addEventListener("click", choose);
      li.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          choose();
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          suggestionsEl.children[Math.min(index + 1, suggestionsEl.children.length - 1)]?.focus();
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          suggestionsEl.children[Math.max(index - 1, 0)]?.focus();
        } else if (event.key === "Escape") {
          closeSuggestions();
          locationInput.focus();
        }
      });
      suggestionsEl.appendChild(li);
    });
    suggestionsEl.hidden = false;
    locationInput.setAttribute("aria-expanded", "true");
  }

  function choosePlace(place) {
    const lat = Number(place.lat);
    const lon = Number(place.lon ?? place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setLocationError("Ta podpowiedź nie zawiera poprawnych współrzędnych. Wybierz inne miejsce.");
      return;
    }

    chosenPlace = { label: getDisplayName(place), lat, lon };
    locationInput.value = chosenPlace.label;
    setLocationError("");
    closeSuggestions();
  }

 

async function searchPlaces(query) {
  if (!window.GEOCODE_URL) {
    setLocationError(
      "Brak konfiguracji wyszukiwania lokalizacji."
    );
    return;
  }

  if (requestController) {
    requestController.abort();
  }

  requestController = new AbortController();

  try {
    const url = new URL(
      window.GEOCODE_URL,
      window.location.origin
    );

    url.searchParams.set("q", query);

    const response = await fetch(url.toString(), {
      signal: requestController.signal,
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error("Błąd wyszukiwania lokalizacji");
    }

    const places = await response.json();

    if (!Array.isArray(places)) {
      throw new Error("Nieprawidłowa odpowiedź geokodera");
    }

    const validPlaces = places.filter(place =>
      place &&
      place.lat != null &&
      (place.lon != null || place.lng != null)
    );

    renderSuggestions(validPlaces);

    if (validPlaces.length === 0) {
      setLocationError("Nie znaleziono lokalizacji.");
    } else {
      setLocationError("");
    }
  } catch (error) {
    if (error.name === "AbortError") return;

    console.error("Autocomplete error:", error);

    setLocationError(
      "Nie udało się wyszukać lokalizacji. Spróbuj ponownie."
    );
  }
}



 
locationInput.addEventListener("input", () => {
  chosenPlace = null;
  setLocationError("");
  closeSuggestions();

  const query = locationInput.value.trim();

  if (query.length < 3) return;

  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    searchPlaces(query);
  }, 350);
});


  locationInput.addEventListener("keydown", event => {
    if (event.key === "ArrowDown" && !suggestionsEl.hidden) {
      event.preventDefault();
      suggestionsEl.querySelector("li")?.focus();
    } else if (event.key === "Escape") {
      closeSuggestions();
    }
  });

  document.addEventListener("click", event => {
    if (!event.target.closest(".autocomplete-wrap")) closeSuggestions();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    statusEl.textContent = "";

    if (!supabase || typeof supabase.from !== "function") {
      statusEl.textContent = "Brak window.supabaseClient. Załaduj inicjalizację Supabase przed formularz.js.";
      return;
    }
    if (!chosenPlace) {
      setLocationError("Wybierz lokalizację z listy podpowiedzi — bez tego wydarzenie nie trafi na mapę.");
      locationInput.focus();
      return;
    }
    if (startDate.value && endDate.value && endDate.value < startDate.value) {
      statusEl.textContent = "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.";
      endDate.focus();
      return;
    }

    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      institution: String(formData.get("institution") || "").trim(),
      start_date: formData.get("start_date") || null,
      end_date: formData.get("end_date") || null,
      location: chosenPlace.label,
      lat: chosenPlace.lat,
      lon: chosenPlace.lon,
      link: String(formData.get("link") || "").trim() || null,
      category: String(formData.get("category") || "").trim(),
      cover_image: String(formData.get("cover_image") || "").trim() || null
    };

    submitButton.disabled = true;
    submitButton.textContent = "zapisywanie…";

    try {
      const { data, error } = await supabase
        .from("events")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      form.reset();
      chosenPlace = null;
      endDate.min = "";
      statusEl.textContent = "Wydarzenie zostało dodane i powinno pojawić się na mapie.";
      console.info("Dodano wydarzenie:", data?.id);
    } catch (error) {
      console.error("Supabase insert error:", error);
      statusEl.textContent = error?.message
        ? `Nie udało się zapisać wydarzenia: ${error.message}`
        : "Nie udało się zapisać wydarzenia. Sprawdź połączenie i uprawnienia Supabase.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "dodaj wydarzenie";
    }
  });
});
