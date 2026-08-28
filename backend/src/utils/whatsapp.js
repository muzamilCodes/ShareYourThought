const normalizePhone = (phone) => phone.replace(/[^\d]/g, "");

export const buildWhatsAppLink = ({
  providerPhone,
  userName,
  address,
  serviceType,
  description,
  phone
}) => {
  const text = [
    `Hello, I need ${serviceType}.`,
    `Name: ${userName}`,
    `Phone: ${phone}`,
    `Address: ${address}`,
    `Problem: ${description}`
  ].join("\n");

  return `https://wa.me/${normalizePhone(providerPhone)}?text=${encodeURIComponent(text)}`;
};
