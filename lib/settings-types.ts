export interface SiteSettings {
  delivery_time_min: string;
  delivery_time_max: string;
  delivery_time_unit: string;
  delivery_note: string;
  in_stock_text: string;
  free_shipping_min_tyres: string;
  free_shipping_threshold: string;
  shipping_cost: string;
  shop_open: string;
  shop_banner_enabled: string;
  shop_message: string;
  vat_rate: string;
  invoice_payment_days: string;
  invoice_bank_name: string;
  company_name: string;
  company_vat: string;
  company_iban: string;
  company_bic: string;
  invoice_footer_note: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  opening_hours: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  delivery_time_min: "2",
  delivery_time_max: "5",
  delivery_time_unit: "werkdagen",
  delivery_note: "Snelle levering in heel België & Nederland",
  in_stock_text: "Op voorraad",
  free_shipping_min_tyres: "2",
  free_shipping_threshold: "0",
  shipping_cost: "9.95",
  shop_open: "true",
  shop_banner_enabled: "false",
  shop_message: "",
  vat_rate: "21",
  invoice_payment_days: "14",
  invoice_bank_name: "KBC Bank",
  company_name: "Gent Bandenservice BV",
  company_vat: "BE 1041093575",
  company_iban: "BE54 7310 7753 4697",
  company_bic: "KREDBEBB",
  invoice_footer_note: "Gelieve het totaalbedrag over te schrijven binnen de betalingstermijn onder vermelding van het factuurnummer.",
  contact_phone: "+32 467871205",
  contact_email: "info@gentbandenservice.be",
  contact_address: "Dendermondsesteenweg 428, 9040 Gent",
  opening_hours: "Maandag - Zat: 09:00 - 18:00",
};
