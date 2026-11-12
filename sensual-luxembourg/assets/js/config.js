/* =========================================================
   Sensual Luxembourg — CONFIGURATION
   Le seul fichier à modifier pour brancher le site sur l'activité réelle.
   (Les massages, durées et prix se modifient directement dans index.html :
    attributs data-prices="durée:prix,durée:prix" de chaque carte.)
   ========================================================= */
window.SL_CONFIG = {
  // Numéro WhatsApp au format international, sans "+" ni espaces. Ex. "352621123456"
  // Astuce démo : mettez votre propre numéro pour montrer le parcours complet au client.
  whatsapp: "",
  whatsappDisplay: "",            // Affichage : "+352 621 123 456"
  email: "",                      // "contact@sensual-luxembourg.lu"

  // Supplément de déplacement ajouté au prix (en euros)
  placeFees: { salon: 0, hotel: 40, domicile: 40 },

  // Horaires des créneaux proposés (heure de début). 0 et 1 = après minuit.
  slots: ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
          "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00", "01:00"],
  daysAhead: 14,                  // nombre de jours réservables
  minNoticeMinutes: 60,           // délai minimum avant un créneau
  simulateBusySlots: true,        // DÉMO : marque quelques créneaux "complet". Mettre false en production.

  // Paiement en ligne
  payment: {
    url: "",                      // lien de paiement de votre prestataire (montant libre de préférence)
    iban: "",                     // facultatif : IBAN pour virement instantané (affiché avec la référence)
    beneficiary: "",              // facultatif : titulaire du compte
    depositPercent: 30,           // acompte proposé en %
  },
};
