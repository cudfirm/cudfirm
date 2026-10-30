const ContactPage = (() => {
  const statusOptions = [
    { value: "published", label: "Published" }, { value: "draft", label: "Draft" },
    { value: "hidden", label: "Hidden" }, { value: "archived", label: "Archived" },
  ];
  const config = {
    table: "contact_content", title: "Contact Content",
    note: "This page controls Contact-section presentation only. Phone, email, WhatsApp, address, and map values remain centralized in Site Settings.",
    groups: [
      { title: "Main content", icon: "bi-envelope-paper", fields: [
        { key: "eyebrow", label: "Eyebrow", maxLength: 80 },
        { key: "title", label: "Main title", required: true, maxLength: 160 },
        { key: "introduction", label: "Introduction", type: "textarea", rows: 4, maxLength: 1500 },
      ]},
      { title: "Contact form copy", icon: "bi-ui-checks", fields: [
        { key: "form_config.nameLabel", label: "Name label", maxLength: 120 },
        { key: "form_config.namePlaceholder", label: "Name placeholder", maxLength: 200 },
        { key: "form_config.contactLabel", label: "Contact label", maxLength: 120 },
        { key: "form_config.contactPlaceholder", label: "Contact placeholder", maxLength: 200 },
        { key: "form_config.messageLabel", label: "Message label", maxLength: 120 },
        { key: "form_config.messagePlaceholder", label: "Message placeholder", type: "textarea", rows: 3, maxLength: 500 },
        { key: "form_config.submitLabel", label: "Submit label", maxLength: 120 },
        { key: "form_config.submittingLabel", label: "Submitting label", maxLength: 120 },
        { key: "form_config.successMessage", label: "Success message", type: "textarea", rows: 2, maxLength: 500 },
        { key: "form_config.errorMessage", label: "Error message", type: "textarea", rows: 2, maxLength: 500 },
        { key: "form_config.whatsappLabel", label: "WhatsApp button label", maxLength: 120 },
        { key: "form_config.emailLabel", label: "Email button label", maxLength: 120 },
        { key: "form_config.privacyText", label: "Privacy note", type: "textarea", rows: 3, maxLength: 1000 },
      ]},
      { title: "Direct contact", icon: "bi-headset", fields: [
        { key: "direct_contact_title", label: "Heading", maxLength: 160 },
        { key: "direct_contact_description", label: "Description", type: "textarea", rows: 3, maxLength: 1500 },
        { key: "business_hours", label: "Business hours", type: "textarea", rows: 2, maxLength: 500 },
        { key: "show_phone", label: "Show phone", type: "checkbox" },
        { key: "show_email", label: "Show email", type: "checkbox" },
        { key: "show_whatsapp", label: "Show WhatsApp", type: "checkbox" },
        { key: "show_address", label: "Show address", type: "checkbox" },
        { key: "show_map", label: "Show map", type: "checkbox" },
        { key: "status", label: "Content status", type: "select", options: statusOptions },
      ]},
    ],
    repeaters: [
      { key: "assurances", label: "Assurance items", itemPrefix: "assurance", hint: "Short trust points displayed near the contact form.", fields: [
        { key: "icon", label: "Icon class or image URL", maxLength: 500 },
        { key: "title", label: "Title", required: true, maxLength: 120 },
        { key: "description", label: "Description", type: "textarea", rows: 2, maxLength: 500 },
      ]},
    ],
    persistFields: ["eyebrow","title","introduction","assurances","form_config.nameLabel","form_config.namePlaceholder","form_config.contactLabel","form_config.contactPlaceholder","form_config.messageLabel","form_config.messagePlaceholder","form_config.submitLabel","form_config.submittingLabel","form_config.successMessage","form_config.errorMessage","form_config.whatsappLabel","form_config.emailLabel","form_config.privacyText","direct_contact_title","direct_contact_description","business_hours","show_phone","show_email","show_whatsapp","show_address","show_map","status"],
  };
  return { init: () => SingletonContentEditor.init(config) };
})();
