export interface Product {
  id: string;
  name: string;
  image: string;
  category: string;
  slug: string;
}

export interface DiamondPackage {
  diamonds: number;
  price: number;
}

export const products: Product[] = [
  { id: "ff-uid", name: "UID TOPUP", image: "uid-topup", category: "FREE FIRE", slug: "uid-topup" },
  { id: "ff-unipin", name: "UniPin Voucher", image: "unipin-voucher", category: "FREE FIRE", slug: "unipin-voucher" },
  { id: "ff-weekly", name: "Weekly & Monthly", image: "weekly-monthly", category: "FREE FIRE", slug: "weekly-monthly" },
];

export const diamondPackages: DiamondPackage[] = [
  { diamonds: 25, price: 22 },
  { diamonds: 50, price: 38 },
  { diamonds: 115, price: 77 },
  { diamonds: 240, price: 153 },
  { diamonds: 355, price: 230 },
  { diamonds: 480, price: 305 },
  { diamonds: 505, price: 327 },
  { diamonds: 610, price: 390 },
  { diamonds: 725, price: 460 },
  { diamonds: 850, price: 540 },
  { diamonds: 1015, price: 655 },
  { diamonds: 1090, price: 700 },
  { diamonds: 1240, price: 760 },
  { diamonds: 1480, price: 925 },
  { diamonds: 1595, price: 1000 },
  { diamonds: 1850, price: 1160 },
];

export const socialLinks = [
  { name: "Telegram", url: "#" },
  { name: "WhatsApp", url: "#" },
  { name: "Facebook", url: "#" },
  { name: "YouTube", url: "#" },
];
