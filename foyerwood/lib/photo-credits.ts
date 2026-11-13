// Credits for photos under licences that require attribution (Creative Commons
// BY / BY-SA), resized for the site and shared under the same licence. Shown
// on the legal notice page. Photos supplied by our partner
// firewood.co.uk are used with their permission.
export interface PhotoCredit {
  /** Where the photo is used on the site. */
  usedFor: { fr: string; en: string };
  title: string;
  author: string;
  license: string;
  /** Page of the original file (licence details). */
  source: string;
}

export const PHOTO_CREDITS: PhotoCredit[] = [
  {
    usedFor: { fr: "Hêtre en vrac", en: "Beech bulk firewood" },
    title: "Buchenholz gehackt",
    author: "Kreuzschnabel",
    license: "CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Buchenholz_gehackt.jpg",
  },
  {
    usedFor: { fr: "Pin en vrac", en: "Pine bulk firewood" },
    title: "Borové špalky",
    author: "Michal Klajban",
    license: "CC BY-SA 3.0",
    source: "https://commons.wikimedia.org/wiki/File:Borov%C3%A9_%C5%A1palky.JPG",
  },
];

export const PARTNER_CREDIT = "firewood.co.uk";
