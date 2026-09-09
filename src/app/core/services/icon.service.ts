import { Injectable } from '@angular/core';

export interface IconData {
  id: string;
  name: string;
  keywords: string[];
  svg: string;
}

@Injectable({
  providedIn: 'root'
})
export class IconService {
  
  // A curated dictionary of modern, premium icons (SVG paths for 24x24 viewport, stroke width 2)
  public readonly ICONS: IconData[] = [
    {
      id: 'food',
      name: 'Food & Dining',
      keywords: ['food', 'dining', 'restaurant', 'burger', 'pizza', 'mcdonalds', 'kfc', 'subway', 'swiggy', 'zomato', 'eat', 'meal', 'lunch', 'dinner', 'breakfast', 'chai', 'samosa', 'biryani', 'dosa', 'paneer', 'thali', 'snack'],
      svg: 'M3 13h18M5 13a7 7 0 0 1 14 0M12 21v-8' // Generic food dome/cloche (simplified)
    },
    {
      id: 'coffee',
      name: 'Coffee',
      keywords: ['coffee', 'tea', 'cafe', 'starbucks', 'beverage', 'drink', 'latte', 'espresso', 'chai'],
      svg: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 1v3 M10 1v3 M14 1v3' // Coffee cup
    },
    {
      id: 'tv',
      name: 'Entertainment & TV',
      keywords: ['tv', 'television', 'netflix', 'prime', 'hulu', 'disney', 'hotstar', 'movies', 'cinema', 'entertainment', 'video', 'streaming', 'jio cinema', 'bookmyshow', 'pvr', 'inox', 'movie', 'show'],
      svg: 'M4 7h16v13H4z M20 7l-8-5-8 5 M12 11v5 M9 13h6' // TV with antenna
    },
    {
      id: 'music',
      name: 'Music & Audio',
      keywords: ['music', 'spotify', 'apple music', 'audio', 'podcast', 'songs', 'concert', 'youtube music', 'gana', 'jiosaavn', 'wynk'],
      svg: 'M9 18V5l12-2v13 M9 9l12-2 M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' // Music note
    },
    {
      id: 'gym',
      name: 'Fitness & Gym',
      keywords: ['gym', 'fitness', 'workout', 'health', 'cult', 'exercise', 'yoga', 'sports', 'cultfit', 'curefit'],
      svg: 'M6.5 6.5l11 11 M3 3l3.5 3.5 M17.5 17.5L21 21 M5 9l-2-2 2-2 2 2 M19 15l2 2-2 2-2-2' // Dumbbell (simplified)
    },
    {
      id: 'shopping',
      name: 'Shopping',
      keywords: ['shopping', 'amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'apparel', 'fashion', 'mall', 'buy', 'retail', 'grocery', 'blinkit', 'zepto', 'instamart', 'meesho', 'ajio', 'dmart', 'reliance', 'bigbasket'],
      svg: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.2 9.3a1 1 0 0 0 1 .7h10.4a1 1 0 0 0 1-.7L17 13 M9 18h6' // Shopping cart
    },
    {
      id: 'bag',
      name: 'Bag',
      keywords: ['bag', 'accessories', 'purse', 'handbag', 'luggage', 'shopping bag'],
      svg: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0' // Shopping bag
    },
    {
      id: 'car',
      name: 'Transport & Car',
      keywords: ['car', 'transport', 'uber', 'ola', 'rapido', 'taxi', 'drive', 'fuel', 'petrol', 'diesel', 'vehicle', 'auto', 'cab', 'cng', 'rickshaw', 'toll', 'fastag', 'parking'],
      svg: 'M3 10h18l-2-4H5l-2 4z M3 10v6a2 2 0 0 0 2 2h1 M18 18h1a2 2 0 0 0 2-2v-6 M6 18v2 M18 18v2 M6 14h.01 M18 14h.01' // Car
    },
    {
      id: 'plane',
      name: 'Travel & Flight',
      keywords: ['flight', 'plane', 'travel', 'trip', 'vacation', 'holiday', 'indigo', 'vistara', 'air', 'airport', 'booking', 'make my trip', 'mmt', 'goibibo', 'cleartrip', 'train', 'irctc', 'bus', 'redbus'],
      svg: 'M17.8 19.2L16 11l3.5-3.5a2.1 2.1 0 1 0-3-3L13 8 4.8 6.2 3 8l6 4.3L5.5 16 3 15.5 2 17l4 2 2 4 1.5-1-1.5-2.5L11.8 15l4.3 6 1.8-1.8z' // Airplane
    },
    {
      id: 'home',
      name: 'Housing & Rent',
      keywords: ['home', 'house', 'rent', 'mortgage', 'maintenance', 'housing', 'apartment', 'pg', 'hostel', 'living', 'maid', 'cook', 'bai', 'society', 'brokerage'],
      svg: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' // House
    },
    {
      id: 'utility',
      name: 'Utilities',
      keywords: ['utility', 'electricity', 'water', 'gas', 'internet', 'broadband', 'wifi', 'jio', 'airtel', 'bill', 'recharge', 'phone', 'mobile', 'bijli', 'pani', 'cylinder', 'vi'],
      svg: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' // Lightning bolt
    },
    {
      id: 'medical',
      name: 'Health & Medical',
      keywords: ['health', 'medical', 'doctor', 'pharmacy', 'medicine', 'hospital', 'clinic', 'apolo', 'pharmeasy', 'netmeds', 'health insurance', '1mg', 'practo', 'dawai', 'test', 'lab'],
      svg: 'M22 12h-4l-3 9L9 3l-3 9H2' // Activity / Heartbeat
    },
    {
      id: 'education',
      name: 'Education',
      keywords: ['education', 'school', 'college', 'course', 'udemy', 'coursera', 'tuition', 'books', 'learning', 'class', 'fees', 'exam', 'stationary', 'pen', 'notebook'],
      svg: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c0 2 3 3 6 3s6-1 6-3v-5' // Graduation cap
    },
    {
      id: 'gift',
      name: 'Gifts & Donations',
      keywords: ['gift', 'present', 'donation', 'charity', 'birthday', 'anniversary', 'wedding', 'festival', 'diwali', 'christmas', 'holi', 'rakhi', 'eid'],
      svg: 'M20 12v8H4v-8 M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z M2 12h20v-5H2z' // Gift box
    },
    {
      id: 'bank',
      name: 'Banking & Finance',
      keywords: ['bank', 'finance', 'invest', 'mutual fund', 'stocks', 'zerodha', 'groww', 'savings', 'loan', 'emi', 'tax', 'insurance', 'crypto', 'upstox', 'sip', 'paytm', 'phonepe', 'gpay', 'bhim', 'upi'],
      svg: 'M3 21h18 M3 10h18 M5 6l7-3 7 3 M4 10v11 M20 10v11 M8 14v3 M12 14v3 M16 14v3' // Bank building
    },
    {
      id: 'credit-card',
      name: 'Credit Card',
      keywords: ['credit card', 'debit card', 'card', 'visa', 'mastercard', 'amex', 'payment', 'bill'],
      svg: 'M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z M2 10h20' // Credit card
    },
    {
      id: 'wallet',
      name: 'Wallet',
      keywords: ['wallet', 'cash', 'money', 'pocket', 'salary', 'income', 'rokar'],
      svg: 'M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4 M4 6v12c0 1.1.9 2 2 2h14v-4H10a2 2 0 0 1 0-4h10 M16 14h.01' // Wallet
    },
    {
      id: 'gamepad',
      name: 'Gaming',
      keywords: ['game', 'gaming', 'playstation', 'xbox', 'nintendo', 'steam', 'epic', 'pubg', 'bgmi', 'valorant', 'hobby'],
      svg: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z' // Message/Chat (placeholder) -- Let's use a gamepad
    },
    {
      id: 'game',
      name: 'Gaming',
      keywords: ['game', 'gaming', 'playstation', 'xbox', 'nintendo', 'steam', 'epic', 'pubg', 'bgmi', 'valorant', 'hobby', 'toy', 'arcade'],
      svg: 'M21 12a9 9 0 0 1-9 9H8a9 9 0 0 1-9-9V8a9 9 0 0 1 9-9h4a9 9 0 0 1 9 9v4z M6 12h4 M8 10v4 M15 13h.01 M18 11h.01' // Gamepad controller
    },
    {
      id: 'pet',
      name: 'Pets',
      keywords: ['pet', 'dog', 'cat', 'vet', 'animal', 'food', 'grooming', 'kutta', 'billi'],
      svg: 'M12 2C8.69 2 6 4.69 6 8c0 5.25 6 13 6 13s6-7.75 6-13c0-3.31-2.69-6-6-6z M12 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z' // Map pin / paw placeholder - let's use paw
    },
    {
      id: 'paw',
      name: 'Pets',
      keywords: ['pet', 'dog', 'cat', 'vet', 'animal', 'grooming', 'paw'],
      svg: 'M12 5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6.5 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M17.5 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M12 24c-5 0-8-3-8-8s3-7 8-7 8 2 8 7-3 8-8 8z' // Paw print
    },
    {
      id: 'haircut',
      name: 'Personal Care',
      keywords: ['haircut', 'salon', 'spa', 'beauty', 'makeup', 'skincare', 'cosmetics', 'grooming', 'barber', 'massage', 'parlour'],
      svg: 'M7 4V2 M17 4V2 M2 20v-2c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v2 M12 16v-6 M8 16V8a4 4 0 0 1 8 0v8' // Comb / Mirror / Scissors proxy
    },
    {
      id: 'scissors',
      name: 'Personal Care',
      keywords: ['haircut', 'salon', 'spa', 'beauty', 'makeup', 'skincare', 'cosmetics', 'grooming', 'barber', 'massage', 'scissor', 'parlour'],
      svg: 'M14.8 9.2l4.8 4.8 M14.8 14.8l4.8-4.8 M6 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6z M6 21a3 3 0 1 1 0-6 3 3 0 0 1 0 6z M8.1 6.9L12 12l-3.9 5.1' // Scissors
    },
    {
      id: 'party',
      name: 'Party & Events',
      keywords: ['party', 'event', 'club', 'pub', 'drinks', 'alcohol', 'bar', 'beer', 'wine', 'celebration', 'wedding', 'marriage', 'shadi', 'daaru'],
      svg: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9' // Glass / Cheers proxy
    },
    {
      id: 'glass',
      name: 'Drinks & Bar',
      keywords: ['party', 'event', 'club', 'pub', 'drinks', 'alcohol', 'bar', 'beer', 'wine', 'cocktail', 'celebration', 'daaru', 'liquor'],
      svg: 'M8 22h8 M12 15v7 M5 3l7 12 7-12H5z' // Cocktail glass
    },
    {
      id: 'software',
      name: 'Software & Tools',
      keywords: ['software', 'app', 'tool', 'subscription', 'github', 'aws', 'cloud', 'hosting', 'domain', 'chatgpt', 'ai', 'adobe', 'figma'],
      svg: 'M2 9a3 3 0 0 1 0-6v2a1 1 0 0 0 0 2v2z M22 9a3 3 0 0 0 0-6v2a1 1 0 0 1 0 2v2z M12 22a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3z M4.5 12h15a2.5 2.5 0 0 1 2.5 2.5v1.5a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-1.5A2.5 2.5 0 0 1 4.5 12z M12 2v2' // Code / Bot proxy
    },
    {
      id: 'terminal',
      name: 'Software & Tools',
      keywords: ['software', 'app', 'tool', 'subscription', 'github', 'aws', 'cloud', 'hosting', 'domain', 'chatgpt', 'ai', 'adobe', 'figma', 'notion', 'code', 'dev', 'server'],
      svg: 'M4 17l6-6-6-6 M12 19h8' // Terminal / Code
    },
    {
      id: 'smartphone',
      name: 'Electronics',
      keywords: ['phone', 'mobile', 'smartphone', 'laptop', 'macbook', 'ipad', 'tablet', 'electronics', 'gadget', 'device', 'apple', 'samsung', 'iphone'],
      svg: 'M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M12 18h.01' // Smartphone
    },
    {
      id: 'laptop',
      name: 'Electronics',
      keywords: ['laptop', 'macbook', 'computer', 'pc', 'electronics', 'hardware', 'keyboard', 'mouse'],
      svg: 'M20 16V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12 M2 20h20 M12 16v4' // Laptop/Monitor
    },
    {
      id: 'wifi',
      name: 'Internet & WiFi',
      keywords: ['wifi', 'internet', 'broadband', 'jio', 'airtel', 'bsnl', 'act', 'router', 'connection', 'network', 'recharge', 'data'],
      svg: 'M5 12.55a11 11 0 0 1 14.08 0 M1.42 9a16 16 0 0 1 21.16 0 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01' // Wifi
    },
    {
      id: 'invoice',
      name: 'Bills & Invoices',
      keywords: ['bill', 'invoice', 'receipt', 'challan', 'tax', 'emi', 'installment', 'fee', 'fine', 'ticket', 'chalan', 'penalty'],
      svg: 'M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2z M8 6h8 M8 10h8 M8 14h4' // Receipt
    },
    {
      id: 'fuel',
      name: 'Fuel & Gas',
      keywords: ['fuel', 'petrol', 'diesel', 'gas', 'cng', 'pump', 'indian oil', 'hp', 'bharat petroleum', 'shell', 'vehicle', 'filling'],
      svg: 'M3 22h12 M5 22V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v16 M15 6h5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2 M18 10v4a2 2 0 0 1-2 2 M7 10h4' // Gas Pump
    },
    {
      id: 'chart',
      name: 'Investments',
      keywords: ['invest', 'stocks', 'mutual fund', 'trading', 'groww', 'zerodha', 'upstox', 'angel one', 'sip', 'portfolio', 'market', 'share', 'equity', 'gold'],
      svg: 'M3 3v18h18 M18 9l-5-5-4 4-6-6 M18 9h-4 M18 9v4' // Chart
    },
    {
      id: 'shirt',
      name: 'Apparel',
      keywords: ['shirt', 'clothes', 'fashion', 'apparel', 'myntra', 'ajio', 'zudio', 'max', 'zara', 'h&m', 'clothing', 'wear', 'tailor', 'boutique', 'darzi'],
      svg: 'M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l1.58 9.2a2 2 0 0 0 2 1.66h.14L6 22a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l0-5.45.14 0a2 2 0 0 0 2-1.66l1.58-9.2a2 2 0 0 0-1.34-2.23z' // Shirt
    },
    {
      id: 'shield',
      name: 'Insurance',
      keywords: ['insurance', 'lic', 'policy', 'premium', 'term plan', 'health insurance', 'star health', 'hdfc ergo', 'secure', 'protection', 'cover'],
      svg: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4 M12 16h.01' // Shield
    },
    {
      id: 'book',
      name: 'Books & Study',
      keywords: ['book', 'reading', 'library', 'notebook', 'stationary', 'kindle', 'novel', 'story', 'publication', 'study', 'exam', 'notes'],
      svg: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20' // Book
    },
    {
      id: 'bear',
      name: 'Baby & Kids',
      keywords: ['baby', 'kids', 'toys', 'diapers', 'firstcry', 'school', 'childcare', 'nanny', 'creche', 'child', 'infant', 'kid'],
      svg: 'M17.5 5.5A2.5 2.5 0 1 0 15 8h-6A2.5 2.5 0 1 0 6.5 5.5 M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0 M9 11h.01 M15 11h.01 M12 14v1' // Bear
    },
    {
      id: 'laundry',
      name: 'Laundry',
      keywords: ['laundry', 'washing', 'dry clean', 'iron', 'dhobi', 'clothes', 'surf excel', 'tide', 'detergent', 'machine'],
      svg: 'M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M5 8h14 M12 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' // Washing Machine
    },
    {
      id: 'tool',
      name: 'Hardware & Repair',
      keywords: ['tool', 'hardware', 'repair', 'mechanic', 'plumber', 'electrician', 'carpenter', 'fixing', 'maintenance', 'service'],
      svg: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' // Wrench
    },
    {
      id: 'default',
      name: 'General',
      keywords: ['general', 'other', 'misc', 'miscellaneous', 'expense', 'cost', 'spend', 'kharcha'],
      svg: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 16v-4 M12 8h.01' // Info circle
    }
  ];

  public readonly DEFAULT_ICON = this.ICONS.find(i => i.id === 'default')!;

  getSuggestedIcons(text: string, limit: number = 5): IconData[] {
    if (!text || text.trim() === '') {
      return this.ICONS.slice(0, limit);
    }

    const query = text.toLowerCase().trim();
    
    // Score each icon based on keyword matches
    const scoredIcons = this.ICONS.map(icon => {
      let score = 0;
      
      // Direct exact match
      if (icon.name.toLowerCase() === query) score += 100;
      
      // Keyword match
      for (const keyword of icon.keywords) {
        if (query === keyword) {
          score += 50;
        } else if (query.includes(keyword) || keyword.includes(query)) {
          score += 10;
        }
      }

      return { icon, score };
    });

    // Sort by score descending
    scoredIcons.sort((a, b) => b.score - a.score);

    // If there are top matches, return them, else return defaults
    const topMatches = scoredIcons.filter(s => s.score > 0).map(s => s.icon);
    
    if (topMatches.length === 0) {
      return this.ICONS.slice(0, limit);
    }

    // Pad with other generic icons if we have less than limit
    const results = [...topMatches];
    for (const icon of this.ICONS) {
      if (results.length >= limit) break;
      if (!results.find(r => r.id === icon.id)) {
        results.push(icon);
      }
    }

    return results.slice(0, limit);
  }

  getIconById(id: string): IconData {
    return this.ICONS.find(i => i.id === id) || this.DEFAULT_ICON;
  }
}
