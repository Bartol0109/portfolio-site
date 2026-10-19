window.dataLayer = window.dataLayer || [];

document.querySelectorAll(".gtm-test-button").forEach(function (button) {
  button.addEventListener("click", function (e) {
    dataLayer.push({
      event: "click",
      button_id: e.target.dataset.event, // "test_button_click", "cta_click" ili "form_submit"
      button_text: e.target.textContent.trim(),
    });
  });
});
