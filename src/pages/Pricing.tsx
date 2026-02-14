import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shirt, 
  ShoppingBag, 
  Sparkles, 
  CheckCircle,
  Info,
  Loader2,
  Footprints,
  Crown
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans';

export function Pricing() {
  const { products, loading, fetchProducts } = useProducts();
  const { plans, fetchPlans } = useSubscriptionPlans();
  const [laundryProducts, setLaundryProducts] = useState<any[]>([]);
  const [suitProducts, setSuitProducts] = useState<any[]>([]);
  const [shoeProducts, setShoeProducts] = useState<any[]>([]);
  const [dryCleanProducts, setDryCleanProducts] = useState<any[]>([]);
  const [addonProducts, setAddonProducts] = useState<any[]>([]);

  // Get the Bubble Pass plan (the middle tier)
  const bubblePassPlan = plans.find(p => p.slug === 'bubble-pass') || plans.find(p => p.name.toLowerCase().includes('bubble'));
  
  // Default values if plan not found
  const planName = bubblePassPlan?.name || 'Bubble Pass';
  const planDescription = bubblePassPlan?.description || 'Get unlimited free delivery and exclusive member discounts.';
  const monthlyPrice = bubblePassPlan?.monthly_price || 9.99;
  const yearlyPrice = bubblePassPlan?.yearly_price || 99.99;
  const features = bubblePassPlan?.features || [
    'Free pickup & delivery (normally $5)',
    '10% off all services',
    'Priority scheduling',
    'Exclusive member promotions'
  ];
  
  // Calculate savings
  const yearlySavings = Math.round(((monthlyPrice * 12) - yearlyPrice) / (monthlyPrice * 12) * 100);

  useEffect(() => {
    fetchProducts();
    fetchPlans();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      setLaundryProducts(products.filter(p => p.category === 'laundry' && p.is_active));
      setSuitProducts(products.filter(p => p.category === 'suit' && p.is_active));
      setShoeProducts(products.filter(p => p.category === 'shoe' && p.is_active));
      setDryCleanProducts(products.filter(p => p.category === 'dry-clean' && p.is_active));
      setAddonProducts(products.filter(p => p.category === 'addon' && p.is_active));
    }
  }, [products]);

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2).replace(/\.00$/, '')}`;
  };

  const formatUnit = (unit: string) => {
    switch (unit) {
      case 'per_item': return 'each';
      case 'per_kg': return 'per kg';
      case 'per_bag': return 'per bag';
      case 'per_pair': return 'per pair';
      default: return unit;
    }
  };

  const categories = [
    {
      name: 'Laundry Services',
      icon: ShoppingBag,
      color: 'bg-[#e14171]',
      items: laundryProducts
    },
    {
      name: 'Suit Cleaning',
      icon: Shirt,
      color: 'bg-black',
      items: suitProducts
    },
    {
      name: 'Shoe Cleaning',
      icon: Footprints,
      color: 'bg-[#e14171]',
      items: shoeProducts
    },
    {
      name: 'Dry Cleaning',
      icon: Sparkles,
      color: 'bg-black',
      items: dryCleanProducts
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#e14171] mx-auto mb-4" />
          <p className="text-gray-600">Loading prices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <section className="bg-gradient-to-r from-black to-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            No hidden fees. Pay only for what you use. Final charge calculated after we process your items.
          </p>
        </div>
      </section>

      {/* Pricing Note */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-pink-50 border border-pink-200 rounded-2xl p-6 flex items-start gap-4">
            <Info className="h-6 w-6 text-[#e14171] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">How Our Pricing Works</h3>
              <p className="text-gray-600">
                We place a small authorization hold ($20) when you book. After pickup, we process your items at our facility 
                and charge you only for the actual service. The final receipt is sent via WhatsApp and email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Price Categories */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {categories.map((category, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className={`${category.color} p-6 text-white`}>
                  <div className="flex items-center gap-3">
                    <category.icon className="h-8 w-8" />
                    <h2 className="text-2xl font-bold">{category.name}</h2>
                  </div>
                </div>
                <div className="p-6">
                  {category.items.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No products available</p>
                  ) : (
                    <table className="w-full">
                      <tbody>
                        {category.items.map((item, itemIdx) => (
                          <tr key={itemIdx} className="border-b last:border-0">
                            <td className="py-4">
                              <div className="font-medium text-gray-900">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-gray-500">{item.description}</div>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              <div className="font-bold text-[#e14171]">{formatPrice(item.price)}</div>
                              <div className="text-sm text-gray-500">{formatUnit(item.unit)}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add-On Services</h2>
          {addonProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No add-on services available</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {addonProducts.map((addon, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900">{addon.name}</span>
                    <span className="font-bold text-[#e14171]">{formatPrice(addon.price)}</span>
                  </div>
                  <p className="text-sm text-gray-500">{addon.description || formatUnit(addon.unit)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bubble Pass Promo */}
      <section className="py-12 bg-gradient-to-r from-[#e14171] to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-pink-100 text-[#e14171] px-4 py-1 rounded-full text-sm font-medium mb-4">
                <Crown className="h-4 w-4" />
                Save More
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                The {planName}
              </h2>
              <p className="text-gray-600 mb-6">
                {planDescription}
              </p>
              <ul className="space-y-3 mb-6">
                {features.slice(0, 4).map((benefit: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/subscription"
                className="inline-flex items-center gap-2 bg-[#e14171] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#c73562] transition-colors"
              >
                Learn More About Bubble Pass
              </Link>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold text-[#e14171]">
                ${monthlyPrice.toFixed(2).replace(/\.00$/, '')}
              </div>
              <div className="text-gray-500">per month</div>
              {yearlySavings > 0 && (
                <div className="mt-4 text-sm">
                  <span className="text-gray-500">or </span>
                  <span className="font-semibold text-gray-900">
                    ${yearlyPrice.toFixed(2).replace(/\.00$/, '')}/year
                  </span>
                  <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    Save {yearlySavings}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">Schedule your first pickup today and experience the difference.</p>
          <Link
            to="/booking"
            className="inline-flex items-center gap-2 bg-[#e14171] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#c73562] transition-colors"
          >
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
}
