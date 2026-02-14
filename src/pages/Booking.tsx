import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Navigation,
  ChevronRight, 
  ChevronLeft,
  Check,
  ShoppingBag,
  Sparkles,
  Clock,
  CreditCard,
  Shirt,
  Wind,
  Droplets,
  Leaf,
  Thermometer,
  Package,
  MessageSquare,
  Smartphone,
  Info,
  Banknote,
  Loader2,
  Tag,
  X,
  Percent
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { usePromoCode } from '../hooks/usePromoCode';
import { useAddresses } from '../hooks/useAddresses';
import { useProducts } from '../hooks/useProducts';
import { useSettings } from '../hooks/useSettings';
import { AuthModal } from '../components/AuthModal';
import { useReferrals } from '../hooks/useReferrals';

type BookingStep = 1 | 2 | 3 | 4;

type ServiceType = 'laundry' | 'suit' | 'shoe' | 'dry-clean' | 'multiple';

type CleaningPreferences = {
  detergent: 'standard' | 'hypoallergenic' | 'eco';
  softener: boolean;
  waterTemp: 'cold' | 'warm';
  dryingHeat: 'low' | 'medium';
};

type FinishingPreferences = {
  foldingStyle: 'square' | 'kondo' | 'rolled';
  shirtsHung: boolean;
  pantsCreased: boolean;
};

type DeliveryPreferences = {
  dropoffInstructions: string;
  packagingType: 'plastic' | 'paper' | 'reusable';
  notificationStyle: 'whatsapp' | 'sms' | 'quiet';
};

type LaundryProfile = 'executive' | 'family' | 'eco' | 'custom';

export function Booking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createOrder } = useOrders(user?.id);
  const { addresses, loading: addressesLoading, addAddress } = useAddresses();
  const { loading: promoLoading, appliedPromo, discountAmount, applyPromoCode, removePromoCode, incrementPromoUsage } = usePromoCode();
  const { products, loading: productsLoading, getProductsByCategory, fetchProducts } = useProducts();
  const { getNumberSetting } = useSettings();
  const { getCreditBalance, useCredits } = useReferrals();
  
  // Get delivery fee from settings (default to 5 if not set)
  const deliveryFee = getNumberSetting('delivery_fee', 5);
  
  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load credit balance for logged-in user
  useEffect(() => {
    let mounted = true;
    const loadBalance = async () => {
      if (!user) {
        if (mounted) setCreditBalance(0);
        return;
      }
      const bal = await getCreditBalance();
      if (mounted) {
        setCreditBalance(bal);
        // reset applied credit if it exceeds new balance
        setCreditToApply((prev) => Math.min(prev, bal));
      }
    };
    loadBalance();
    return () => {
      mounted = false;
    };
  }, [user, getCreditBalance]);
  
  // Debug: Log products when they change
  useEffect(() => {
    if (products.length > 0) {
      console.log('Products loaded:', products.length, 'items');
      console.log('Laundry products:', products.filter(p => p.category === 'laundry'));
    }
  }, [products]);
  
  // Get products by category (memoized to prevent re-renders)
  const laundryProducts = products.filter(p => p.category === 'laundry' && p.is_active);
  const suitProducts = products.filter(p => p.category === 'suit' && p.is_active);
  const shoeProducts = products.filter(p => p.category === 'shoe' && p.is_active);
  const dryCleanProducts = products.filter(p => p.category === 'dry-clean' && p.is_active);
  const addonProducts = products.filter(p => p.category === 'addon' && p.is_active);
  
  // Suppress unused variable warning for getProductsByCategory
  void getProductsByCategory;
  
  const [step, setStep] = useState<BookingStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [applyCredits, setApplyCredits] = useState(false);
  const [creditToApply, setCreditToApply] = useState(0);
  const [location, setLocation] = useState({
    address: '',
    landmark: '',
    usingGPS: false
  });
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [bagSize, setBagSize] = useState<'regular' | 'large' | null>(null);
  const [hangDry, setHangDry] = useState(false);
  const [suitItems, setSuitItems] = useState<string[]>([]);
  const [shoeItems, setShoeItems] = useState<string[]>([]);
  const [dryCleanItems, setDryCleanItems] = useState<string[]>([]);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupSlot, setPickupSlot] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<LaundryProfile | null>(null);
  const [cleaningPrefs, setCleaningPrefs] = useState<CleaningPreferences>({
    detergent: null as unknown as CleaningPreferences['detergent'],
    softener: false,
    waterTemp: null as unknown as CleaningPreferences['waterTemp'],
    dryingHeat: null as unknown as CleaningPreferences['dryingHeat']
  });
  const [finishingPrefs, setFinishingPrefs] = useState<FinishingPreferences>({
    foldingStyle: null as unknown as FinishingPreferences['foldingStyle'],
    shirtsHung: false,
    pantsCreased: false
  });
  const [deliveryPrefs, setDeliveryPrefs] = useState<DeliveryPreferences>({
    dropoffInstructions: '',
    packagingType: null as unknown as DeliveryPreferences['packagingType'],
    notificationStyle: null as unknown as DeliveryPreferences['notificationStyle']
  });
  const [addons, setAddons] = useState({
    stainTreatment: false,
    whitening: false,
    scentBoosters: false,
    repairs: false
  });
  const [stainNote, setStainNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet' | 'cash' | null>(null);
  const [customDropoffInstruction, setCustomDropoffInstruction] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('');
  const [reorderLoaded, setReorderLoaded] = useState(false);

  // Get bag products for laundry
  const regularBagProduct = laundryProducts.find(p => p.name.toLowerCase().includes('regular'));
  const largeBagProduct = laundryProducts.find(p => p.name.toLowerCase().includes('large'));
  const hangDryProduct = laundryProducts.find(p => p.name.toLowerCase().includes('hang'));
  
  // Format products for display
  const formatPrice = (price: number) => `$${price.toFixed(0)}`;
  
  // Create options arrays from database products
  const suitOptions = suitProducts.map(p => ({
    id: p.id,
    name: p.name,
    price: formatPrice(p.price),
    priceNum: p.price
  }));

  const shoeOptions = shoeProducts.map(p => ({
    id: p.id,
    name: p.name,
    price: formatPrice(p.price),
    priceNum: p.price
  }));

  const dryCleaningOptions = dryCleanProducts.map(p => ({
    id: p.id,
    name: p.name,
    price: formatPrice(p.price),
    priceNum: p.price
  }));

  // Load reorder data from sessionStorage
  useEffect(() => {
    if (reorderLoaded) return;
    
    const reorderDataStr = sessionStorage.getItem('reorderData');
    if (reorderDataStr) {
      try {
        const reorderData = JSON.parse(reorderDataStr);
        console.log('Loading reorder data:', reorderData);
        
        // Set service type
        if (reorderData.serviceType) {
          setServiceType(reorderData.serviceType as ServiceType);
        }
        
        // Set items based on order items
        if (reorderData.items && Array.isArray(reorderData.items)) {
          reorderData.items.forEach((item: { item_type: string; item_name: string }) => {
            if (item.item_type === 'laundry_bag') {
              if (item.item_name.toLowerCase().includes('large')) {
                setBagSize('large');
              } else {
                setBagSize('regular');
              }
            } else if (item.item_type === 'addon' && item.item_name.toLowerCase().includes('hang')) {
              setHangDry(true);
            } else if (item.item_type === 'suit') {
              const suitOption = suitOptions.find(o => 
                o.name.toLowerCase() === item.item_name.toLowerCase()
              );
              if (suitOption) {
                setSuitItems(prev => [...prev, suitOption.id]);
              }
            } else if (item.item_type === 'shoe') {
              const shoeOption = shoeOptions.find(o => 
                o.name.toLowerCase() === item.item_name.toLowerCase()
              );
              if (shoeOption) {
                setShoeItems(prev => [...prev, shoeOption.id]);
              }
            } else if (item.item_type === 'dry_clean') {
              const dryCleanOption = dryCleaningOptions.find(o => 
                o.name.toLowerCase() === item.item_name.toLowerCase()
              );
              if (dryCleanOption) {
                setDryCleanItems(prev => [...prev, dryCleanOption.id]);
              }
            }
          });
        }
        
        // Set preferences
        if (reorderData.preferences) {
          const prefs = reorderData.preferences;
          if (prefs.detergent_type) {
            setCleaningPrefs(prev => ({ ...prev, detergent: prefs.detergent_type }));
          }
          if (prefs.fabric_softener !== undefined) {
            setCleaningPrefs(prev => ({ ...prev, softener: prefs.fabric_softener }));
          }
          if (prefs.water_temp) {
            setCleaningPrefs(prev => ({ ...prev, waterTemp: prefs.water_temp }));
          }
          if (prefs.drying_heat) {
            setCleaningPrefs(prev => ({ ...prev, dryingHeat: prefs.drying_heat }));
          }
          if (prefs.folding_style) {
            setFinishingPrefs(prev => ({ ...prev, foldingStyle: prefs.folding_style }));
          }
          if (prefs.shirts_hung !== undefined) {
            setFinishingPrefs(prev => ({ ...prev, shirtsHung: prefs.shirts_hung }));
          }
          if (prefs.pants_creased !== undefined) {
            setFinishingPrefs(prev => ({ ...prev, pantsCreased: prefs.pants_creased }));
          }
          if (prefs.dropoff_instructions) {
            setDeliveryPrefs(prev => ({ ...prev, dropoffInstructions: prefs.dropoff_instructions }));
          }
          if (prefs.custom_dropoff_instruction) {
            setCustomDropoffInstruction(prefs.custom_dropoff_instruction);
          }
          if (prefs.packaging_type) {
            setDeliveryPrefs(prev => ({ ...prev, packagingType: prefs.packaging_type }));
          }
          if (prefs.notification_style) {
            setDeliveryPrefs(prev => ({ ...prev, notificationStyle: prefs.notification_style }));
          }
        }
        
        // Set addons
        if (reorderData.addons && Array.isArray(reorderData.addons)) {
          reorderData.addons.forEach((addon: { addon_type: string }) => {
            if (addon.addon_type === 'stain_treatment') {
              setAddons(prev => ({ ...prev, stainTreatment: true }));
            } else if (addon.addon_type === 'whitening') {
              setAddons(prev => ({ ...prev, whitening: true }));
            } else if (addon.addon_type === 'scent_boosters') {
              setAddons(prev => ({ ...prev, scentBoosters: true }));
            } else if (addon.addon_type === 'repairs') {
              setAddons(prev => ({ ...prev, repairs: true }));
            }
          });
        }
        
        // Clear the reorder data from sessionStorage
        sessionStorage.removeItem('reorderData');
        
        setReorderLoaded(true);
      } catch (error) {
        console.error('Error parsing reorder data:', error);
        sessionStorage.removeItem('reorderData');
      }
    }
    setReorderLoaded(true);
  }, [reorderLoaded]);

  const steps = [
    { num: 1, title: 'Location', icon: MapPin },
    { num: 2, title: 'Services', icon: ShoppingBag },
    { num: 3, title: 'Schedule', icon: Clock },
    { num: 4, title: 'Checkout', icon: CreditCard },
  ];

  const timeSlots = [
    { id: '9-11', label: '9:00 AM - 11:00 AM', available: true },
    { id: '11-1', label: '11:00 AM - 1:00 PM', available: true },
    { id: '1-3', label: '1:00 PM - 3:00 PM', available: true },
    { id: '3-5', label: '3:00 PM - 5:00 PM', available: true },
    { id: '5-7', label: '5:00 PM - 7:00 PM', available: true },
    { id: '7-9', label: '7:00 PM - 9:00 PM', available: true },
  ];

  // Generate available dates (next 14 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' }),
        fullDisplay: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      });
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  // Get minimum delivery date (at least 1 day after pickup)
  const getMinDeliveryDates = () => {
    if (!pickupDate) return availableDates.slice(1);
    const pickupIndex = availableDates.findIndex(d => d.date === pickupDate);
    return availableDates.slice(pickupIndex + 1);
  };

  const deliveryDates = getMinDeliveryDates();

  const laundryProfiles = [
    {
      id: 'executive' as LaundryProfile,
      name: 'The Executive',
      description: 'Everything on hangers, starched, premium scent',
      settings: {
        cleaning: { detergent: 'standard', softener: true, waterTemp: 'warm', dryingHeat: 'medium' },
        finishing: { foldingStyle: 'square', shirtsHung: true, pantsCreased: true }
      }
    },
    {
      id: 'family' as LaundryProfile,
      name: 'The Family',
      description: 'Fragrance-free, folded, large bags, cold wash',
      settings: {
        cleaning: { detergent: 'hypoallergenic', softener: false, waterTemp: 'cold', dryingHeat: 'low' },
        finishing: { foldingStyle: 'square', shirtsHung: false, pantsCreased: false }
      }
    },
    {
      id: 'eco' as LaundryProfile,
      name: 'The Eco-Warrior',
      description: 'Cold wash, eco-detergent, paper bags, no dryer',
      settings: {
        cleaning: { detergent: 'eco', softener: false, waterTemp: 'cold', dryingHeat: 'low' },
        finishing: { foldingStyle: 'rolled', shirtsHung: false, pantsCreased: false }
      }
    }
  ];

  const applyProfile = (profileId: LaundryProfile) => {
    setSelectedProfile(profileId);
    const profile = laundryProfiles.find(p => p.id === profileId);
    if (profile) {
      setCleaningPrefs(profile.settings.cleaning as CleaningPreferences);
      setFinishingPrefs(profile.settings.finishing as FinishingPreferences);
      if (profileId === 'eco') {
        setDeliveryPrefs(prev => ({ ...prev, packagingType: 'paper' }));
      }
    }
  };

  const useCurrentLocation = () => {
    setLocation({
      address: '123 Main Street, Downtown District',
      landmark: 'Near City Center Mall',
      usingGPS: true
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return location.address.trim().length >= 3;
      case 2:
        if (!serviceType) return false;
        if (serviceType === 'laundry') return bagSize !== null;
        if (serviceType === 'suit') return suitItems.length > 0;
        if (serviceType === 'shoe') return shoeItems.length > 0;
        if (serviceType === 'dry-clean') return dryCleanItems.length > 0;
        if (serviceType === 'multiple') return bagSize !== null || suitItems.length > 0 || shoeItems.length > 0 || dryCleanItems.length > 0;
        return true;
      case 3:
        return pickupDate && pickupSlot && deliveryDate && deliverySlot;
      case 4:
        return paymentMethod !== null;
      default:
        return true;
    }
  };

  const calculateTotal = () => {
    let total = 0;
    if (serviceType === 'laundry' || serviceType === 'multiple') {
      if (bagSize === 'regular' && regularBagProduct) total += regularBagProduct.price;
      else if (bagSize === 'large' && largeBagProduct) total += largeBagProduct.price;
      if (hangDry && hangDryProduct) total += hangDryProduct.price;
    }
    if (serviceType === 'suit' || serviceType === 'multiple') {
      suitItems.forEach(item => {
        const opt = suitOptions.find(o => o.id === item);
        if (opt) total += opt.priceNum;
      });
    }
    if (serviceType === 'shoe' || serviceType === 'multiple') {
      shoeItems.forEach(item => {
        const opt = shoeOptions.find(o => o.id === item);
        if (opt) total += opt.priceNum;
      });
    }
    if (serviceType === 'dry-clean' || serviceType === 'multiple') {
      dryCleanItems.forEach(item => {
        const opt = dryCleaningOptions.find(o => o.id === item);
        if (opt) total += opt.priceNum;
      });
    }
    // Add addon prices from database
    const stainProduct = addonProducts.find(p => p.name.toLowerCase().includes('stain'));
    const whiteningProduct = addonProducts.find(p => p.name.toLowerCase().includes('whiten'));
    const scentProduct = addonProducts.find(p => p.name.toLowerCase().includes('scent'));
    const repairProduct = addonProducts.find(p => p.name.toLowerCase().includes('repair') && !p.name.toLowerCase().includes('minor'));
    
    if (addons.stainTreatment && stainProduct) total += stainProduct.price;
    if (addons.whitening && whiteningProduct) total += whiteningProduct.price;
    if (addons.scentBoosters && scentProduct) total += scentProduct.price;
    if (addons.repairs && repairProduct) total += repairProduct.price;
    return total;
  };

  const computePricing = () => {
    const subtotal = calculateTotal();
    const orderDeliveryFee = appliedPromo?.discount_type === 'free_delivery' ? 0 : deliveryFee;
    const discount = discountAmount;
    const totalBeforeCredit = subtotal + orderDeliveryFee - discount;
    const maxCredit = Math.min(creditBalance, totalBeforeCredit);
    const appliedCredit = applyCredits ? Math.min(creditToApply || 0, maxCredit) : 0;
    const payable = Math.max(0, totalBeforeCredit - appliedCredit);
    return { subtotal, orderDeliveryFee, discount, totalBeforeCredit, appliedCredit, payable, maxCredit };
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Progress Header */}
      <div className="bg-black shadow-sm sticky top-16 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step > s.num
                        ? 'bg-green-500 text-white'
                        : step === s.num
                        ? 'bg-[#e14171] text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {step > s.num ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <s.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${
                    step === s.num ? 'text-[#e14171] font-medium' : 'text-gray-400'
                  }`}>
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-12 sm:w-24 h-1 mx-2 rounded ${
                    step > s.num ? 'bg-green-500' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Where should we pick up?</h2>
              <p className="text-gray-600">Help us find you with precise location details.</p>
            </div>

            {/* Saved Addresses - Only show if user is logged in and has addresses */}
            {user && addresses.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#e14171]" />
                  Saved Addresses
                </h3>
                {addressesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-[#e14171]" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setLocation({
                            address: addr.address,
                            landmark: addr.landmark,
                            usingGPS: false
                          });
                          setSaveThisAddress(false);
                        }}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-[#e14171] bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedAddressId === addr.id ? 'bg-[#e14171] text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{addr.label}</span>
                                {addr.is_default && (
                                  <span className="text-xs bg-pink-100 text-[#e14171] px-2 py-0.5 rounded-full">Default</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{addr.address}</p>
                              {addr.landmark && (
                                <p className="text-xs text-gray-500">{addr.landmark}</p>
                              )}
                            </div>
                          </div>
                          {selectedAddressId === addr.id && (
                            <Check className="h-5 w-5 text-[#e14171]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or use a new address</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <button
                onClick={() => {
                  useCurrentLocation();
                  setSelectedAddressId(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#e14171] rounded-xl text-[#e14171] font-medium hover:bg-pink-50 transition-colors"
              >
                <Navigation className="h-5 w-5" />
                {location.usingGPS ? 'Location detected!' : 'Use My Current Location'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or enter manually</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address / Area <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${location.address.trim().length >= 3 ? 'text-green-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Enter your street address..."
                    value={location.address}
                    onChange={(e) => {
                      setLocation({ ...location, address: e.target.value, usingGPS: false });
                      setSelectedAddressId(null);
                    }}
                    className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171] ${location.address.trim().length >= 3 ? 'border-green-500' : 'border-gray-200'}`}
                  />
                  {location.address.trim().length >= 3 && (
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                {location.address.trim().length > 0 && location.address.trim().length < 3 && (
                  <p className="mt-1 text-sm text-red-500">Please enter at least 3 characters</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Landmark (Recommended)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., Near the Red Mosque, 2nd floor above the pharmacy"
                    value={location.landmark}
                    onChange={(e) => setLocation({ ...location, landmark: e.target.value })}
                    className={`w-full px-4 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171] ${location.landmark.trim().length >= 3 ? 'border-green-500' : 'border-gray-200'}`}
                  />
                  {location.landmark.trim().length >= 3 && (
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This helps our drivers find you quickly in areas without clear addresses.
                </p>
              </div>

              {/* Save this address checkbox - only show if user is logged in and not using a saved address */}
              {user && !selectedAddressId && location.address.trim().length >= 3 && (
                <div className="border-t pt-4 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveThisAddress}
                      onChange={(e) => setSaveThisAddress(e.target.checked)}
                      className="w-5 h-5 rounded text-[#e14171]"
                    />
                    <span className="text-gray-700">Save this address for future orders</span>
                  </label>

                  {saveThisAddress && (
                    <div className="mt-3 ml-8">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Label
                      </label>
                      <div className="flex gap-2 mb-2">
                        {['Home', 'Work', 'Other'].map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setAddressLabel(label)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              addressLabel === label
                                ? 'bg-[#e14171] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={addressLabel}
                        onChange={(e) => setAddressLabel(e.target.value)}
                        placeholder="Or enter custom label..."
                        className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171] text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Map Placeholder */}
              <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-[#e14171]" />
                  <p>Drag the pin to your exact location</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Services */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What do you need cleaned?</h2>
              <p className="text-gray-600">Select your services and preferences.</p>
            </div>
            
            {/* Loading indicator for products */}
            {productsLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
                <span className="ml-2 text-gray-600">Loading services...</span>
              </div>
            )}

            {/* Service Type */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Service Type</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: 'laundry', label: 'Laundry', icon: Droplets },
                  { id: 'suit', label: 'Suit', icon: Shirt },
                  { id: 'shoe', label: 'Shoe', icon: Sparkles },
                  { id: 'dry-clean', label: 'Dry Clean', icon: Wind },
                  { id: 'multiple', label: 'Multiple', icon: ShoppingBag },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setServiceType(type.id as ServiceType)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      serviceType === type.id
                        ? 'border-[#e14171] bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <type.icon className={`h-6 w-6 mx-auto mb-2 ${
                      serviceType === type.id ? 'text-[#e14171]' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      serviceType === type.id ? 'text-[#e14171]' : 'text-gray-700'
                    }`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
              {!serviceType && (
                <p className="text-sm text-gray-500 mt-3">Please select a service type to continue</p>
              )}
            </div>

            {/* Laundry Options */}
            {(serviceType === 'laundry' || serviceType === 'multiple') && (
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-900">Laundry Service</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Bag Size</label>
                  <div className="grid grid-cols-2 gap-3">
                    {regularBagProduct && (
                      <button
                        onClick={() => setBagSize('regular')}
                        className={`p-4 rounded-xl border-2 text-left ${
                          bagSize === 'regular' ? 'border-[#e14171] bg-pink-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="font-medium">{regularBagProduct.name}</div>
                        <div className="text-sm text-gray-500">{regularBagProduct.description} • ${regularBagProduct.price}</div>
                      </button>
                    )}
                    {largeBagProduct && (
                      <button
                        onClick={() => setBagSize('large')}
                        className={`p-4 rounded-xl border-2 text-left ${
                          bagSize === 'large' ? 'border-[#e14171] bg-pink-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="font-medium">{largeBagProduct.name}</div>
                        <div className="text-sm text-gray-500">{largeBagProduct.description} • ${largeBagProduct.price}</div>
                      </button>
                    )}
                  </div>
                </div>

                {hangDryProduct && (
                  <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hangDry}
                      onChange={(e) => setHangDry(e.target.checked)}
                      className="w-5 h-5 rounded text-[#e14171]"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <Wind className="h-4 w-4" /> {hangDryProduct.name}
                      </div>
                      <div className="text-sm text-gray-500">{hangDryProduct.description} (+${hangDryProduct.price})</div>
                    </div>
                  </label>
                )}
              </div>
            )}

            {/* Suit Options */}
            {(serviceType === 'suit' || serviceType === 'multiple') && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Suit Cleaning Items</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {suitOptions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSuitItems(prev =>
                          prev.includes(item.id)
                            ? prev.filter(i => i !== item.id)
                            : [...prev, item.id]
                        );
                      }}
                      className={`p-4 rounded-xl border-2 text-center ${
                        suitItems.includes(item.id)
                          ? 'border-[#e14171] bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Shirt className={`h-6 w-6 mx-auto mb-2 ${
                        suitItems.includes(item.id) ? 'text-[#e14171]' : 'text-gray-400'
                      }`} />
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shoe Options */}
            {(serviceType === 'shoe' || serviceType === 'multiple') && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Shoe Cleaning Items</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {shoeOptions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setShoeItems(prev =>
                          prev.includes(item.id)
                            ? prev.filter(i => i !== item.id)
                            : [...prev, item.id]
                        );
                      }}
                      className={`p-4 rounded-xl border-2 text-center ${
                        shoeItems.includes(item.id)
                          ? 'border-[#e14171] bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Sparkles className={`h-6 w-6 mx-auto mb-2 ${
                        shoeItems.includes(item.id) ? 'text-[#e14171]' : 'text-gray-400'
                      }`} />
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dry Cleaning Options */}
            {(serviceType === 'dry-clean' || serviceType === 'multiple') && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Dry Cleaning Items</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dryCleaningOptions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setDryCleanItems(prev =>
                          prev.includes(item.id)
                            ? prev.filter(i => i !== item.id)
                            : [...prev, item.id]
                        );
                      }}
                      className={`p-4 rounded-xl border-2 text-center ${
                        dryCleanItems.includes(item.id)
                          ? 'border-[#e14171] bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Wind className={`h-6 w-6 mx-auto mb-2 ${
                        dryCleanItems.includes(item.id) ? 'text-[#e14171]' : 'text-gray-400'
                      }`} />
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Laundry Profiles - only show for laundry */}
            {(serviceType === 'laundry' || serviceType === 'multiple') && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Quick Preference Profiles</h3>
                <p className="text-sm text-gray-500 mb-4">Choose a preset or customize below</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {laundryProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => applyProfile(profile.id)}
                      className={`p-4 rounded-xl border-2 text-left ${
                        selectedProfile === profile.id
                          ? 'border-[#e14171] bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{profile.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{profile.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cleaning Preferences - only for laundry */}
            {(serviceType === 'laundry' || serviceType === 'multiple') && (
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-[#e14171]" />
                  Cleaning Preferences
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Detergent Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'standard', label: 'Standard', desc: 'Premium scented' },
                      { id: 'hypoallergenic', label: 'Hypoallergenic', desc: 'Scent-free' },
                      { id: 'eco', label: 'Eco-Friendly', desc: 'Plant-based' },
                    ].map((det) => (
                      <button
                        key={det.id}
                        onClick={() => {
                          setCleaningPrefs({ ...cleaningPrefs, detergent: det.id as CleaningPreferences['detergent'] });
                          setSelectedProfile('custom');
                        }}
                        className={`p-3 rounded-lg border-2 text-left ${
                          cleaningPrefs.detergent === det.id
                            ? 'border-[#e14171] bg-pink-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="text-sm font-medium">{det.label}</div>
                        <div className="text-xs text-gray-500">{det.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Thermometer className="h-4 w-4 inline mr-1" />
                      Water Temp
                    </label>
                    <select
                      value={cleaningPrefs.waterTemp}
                      onChange={(e) => {
                        setCleaningPrefs({ ...cleaningPrefs, waterTemp: e.target.value as CleaningPreferences['waterTemp'] });
                        setSelectedProfile('custom');
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                    >
                      <option value="cold">Cold (Color safe)</option>
                      <option value="warm">Warm (Whites)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Leaf className="h-4 w-4 inline mr-1" />
                      Drying Heat
                    </label>
                    <select
                      value={cleaningPrefs.dryingHeat}
                      onChange={(e) => {
                        setCleaningPrefs({ ...cleaningPrefs, dryingHeat: e.target.value as CleaningPreferences['dryingHeat'] });
                        setSelectedProfile('custom');
                      }}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                    >
                      <option value="low">Low (Prevents shrinking)</option>
                      <option value="medium">Medium/High</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cleaningPrefs.softener}
                    onChange={(e) => {
                      setCleaningPrefs({ ...cleaningPrefs, softener: e.target.checked });
                      setSelectedProfile('custom');
                    }}
                    className="w-5 h-5 rounded text-[#e14171]"
                  />
                  <span className="text-gray-700">Add fabric softener</span>
                </label>
              </div>
            )}

            {/* Finishing Preferences - only for laundry */}
            {(serviceType === 'laundry' || serviceType === 'multiple') && (
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Shirt className="h-5 w-5 text-[#e14171]" />
                  Finishing & Folding
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Folding Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'square', label: 'Square Fold', desc: 'Classic, stackable' },
                      { id: 'kondo', label: 'Marie Kondo', desc: 'Vertical filing' },
                      { id: 'rolled', label: 'Rolled', desc: 'For travel' },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setFinishingPrefs({ ...finishingPrefs, foldingStyle: style.id as FinishingPreferences['foldingStyle'] });
                          setSelectedProfile('custom');
                        }}
                        className={`p-3 rounded-lg border-2 ${
                          finishingPrefs.foldingStyle === style.id
                            ? 'border-[#e14171] bg-pink-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="text-sm font-medium">{style.label}</div>
                        <div className="text-xs text-gray-500">{style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={finishingPrefs.shirtsHung}
                      onChange={(e) => {
                        setFinishingPrefs({ ...finishingPrefs, shirtsHung: e.target.checked });
                        setSelectedProfile('custom');
                      }}
                      className="w-5 h-5 rounded text-[#e14171]"
                    />
                    <div>
                      <div className="text-gray-700">Shirts on hangers</div>
                      <div className="text-xs text-gray-500">Protective cover included</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={finishingPrefs.pantsCreased}
                      onChange={(e) => {
                        setFinishingPrefs({ ...finishingPrefs, pantsCreased: e.target.checked });
                        setSelectedProfile('custom');
                      }}
                      className="w-5 h-5 rounded text-[#e14171]"
                    />
                    <div>
                      <div className="text-gray-700">Crease pants/trousers</div>
                      <div className="text-xs text-gray-500">Professional pressed look</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Add-ons */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#e14171]" />
                Special Add-ons
              </h3>

              <div className="grid sm:grid-cols-2 gap-3">
                {(() => {
                  const stainProduct = addonProducts.find(p => p.name.toLowerCase().includes('stain'));
                  const whiteningProduct = addonProducts.find(p => p.name.toLowerCase().includes('whiten'));
                  const scentProduct = addonProducts.find(p => p.name.toLowerCase().includes('scent'));
                  const repairProduct = addonProducts.find(p => p.name.toLowerCase().includes('button') || (p.name.toLowerCase().includes('repair') && !p.name.toLowerCase().includes('minor')));
                  
                  return [
                    { key: 'stainTreatment', label: stainProduct?.name || 'Stain Treatment', price: `+$${stainProduct?.price || 5}`, hasNote: true },
                    { key: 'whitening', label: whiteningProduct?.name || 'Brighten Whites', price: `+$${whiteningProduct?.price || 4}`, hasNote: false },
                    { key: 'scentBoosters', label: scentProduct?.name || 'Scent Boosters', price: `+$${scentProduct?.price || 3}`, hasNote: false },
                    { key: 'repairs', label: repairProduct?.name || 'Small Repairs', price: `+$${repairProduct?.price || 2}`, hasNote: false },
                  ].map((addon) => (
                    <label
                      key={addon.key}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${
                        addons[addon.key as keyof typeof addons]
                          ? 'border-[#e14171] bg-pink-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={addons[addon.key as keyof typeof addons]}
                        onChange={(e) => setAddons({ ...addons, [addon.key]: e.target.checked })}
                        className="w-5 h-5 rounded text-[#e14171]"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{addon.label}</div>
                        <div className="text-sm text-gray-500">{addon.price}</div>
                      </div>
                    </label>
                  ));
                })()}
              </div>

              {addons.stainTreatment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stain notes (describe location and type)
                  </label>
                  <textarea
                    value={stainNote}
                    onChange={(e) => setStainNote(e.target.value)}
                    placeholder="e.g., Coffee stain on the white polo shirt, right side..."
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose your time windows</h2>
              <p className="text-gray-600">Select a date and 2-hour window for pickup and delivery.</p>
            </div>

            {/* Pickup Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-[#e14171] text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                Pickup Date & Time
              </h3>
              
              {/* Pickup Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Pickup Date</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {availableDates.map((d) => (
                    <button
                      key={d.date}
                      onClick={() => {
                        setPickupDate(d.date);
                        // Reset delivery date if it's before the new pickup date
                        if (deliveryDate && deliveryDate <= d.date) {
                          setDeliveryDate('');
                          setDeliverySlot('');
                        }
                      }}
                      className={`flex-shrink-0 w-20 p-3 rounded-xl border-2 text-center transition-all ${
                        pickupDate === d.date
                          ? 'border-[#e14171] bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`text-xs font-medium ${pickupDate === d.date ? 'text-[#e14171]' : 'text-gray-500'}`}>
                        {d.dayName}
                      </div>
                      <div className={`text-xl font-bold ${pickupDate === d.date ? 'text-[#e14171]' : 'text-gray-900'}`}>
                        {d.dayNum}
                      </div>
                      <div className={`text-xs ${pickupDate === d.date ? 'text-[#e14171]' : 'text-gray-500'}`}>
                        {d.monthName}
                      </div>
                    </button>
                  ))}
                </div>
                {pickupDate && (
                  <p className="mt-2 text-sm text-[#e14171] font-medium">
                    Selected: {availableDates.find(d => d.date === pickupDate)?.fullDisplay}
                  </p>
                )}
              </div>

              {/* Pickup Time Slots */}
              {pickupDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Pickup Time Slot</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => slot.available && setPickupSlot(slot.id)}
                        disabled={!slot.available}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          !slot.available
                            ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : pickupSlot === slot.id
                            ? 'border-[#e14171] bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Clock className={`h-4 w-4 ${pickupSlot === slot.id ? 'text-[#e14171]' : 'text-gray-400'}`} />
                          <span className={`font-medium text-sm ${pickupSlot === slot.id ? 'text-[#e14171]' : ''}`}>{slot.label}</span>
                        </div>
                        {!slot.available && (
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded mt-2 inline-block">Full</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!pickupDate && (
                <p className="text-sm text-gray-500 italic">Please select a pickup date first</p>
              )}
            </div>

            {/* Delivery Section */}
            <div className={`bg-white rounded-2xl p-6 shadow-sm ${!pickupDate || !pickupSlot ? 'opacity-50' : ''}`}>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  pickupDate && pickupSlot ? 'bg-[#e14171] text-white' : 'bg-gray-300 text-gray-500'
                }`}>2</div>
                Delivery Date & Time
              </h3>
              
              {pickupDate && pickupSlot ? (
                <>
                  {/* Delivery Date Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Delivery Date
                      <span className="text-gray-500 font-normal ml-2">(min. 24h after pickup)</span>
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {deliveryDates.map((d) => (
                        <button
                          key={d.date}
                          onClick={() => setDeliveryDate(d.date)}
                          className={`flex-shrink-0 w-20 p-3 rounded-xl border-2 text-center transition-all ${
                            deliveryDate === d.date
                              ? 'border-[#e14171] bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`text-xs font-medium ${deliveryDate === d.date ? 'text-[#e14171]' : 'text-gray-500'}`}>
                            {d.dayName}
                          </div>
                          <div className={`text-xl font-bold ${deliveryDate === d.date ? 'text-[#e14171]' : 'text-gray-900'}`}>
                            {d.dayNum}
                          </div>
                          <div className={`text-xs ${deliveryDate === d.date ? 'text-[#e14171]' : 'text-gray-500'}`}>
                            {d.monthName}
                          </div>
                        </button>
                      ))}
                    </div>
                    {deliveryDate && (
                      <p className="mt-2 text-sm text-[#e14171] font-medium">
                        Selected: {availableDates.find(d => d.date === deliveryDate)?.fullDisplay}
                      </p>
                    )}
                  </div>

                  {/* Delivery Time Slots */}
                  {deliveryDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Select Delivery Time Slot</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setDeliverySlot(slot.id)}
                            className={`p-4 rounded-xl border-2 text-center transition-all ${
                              deliverySlot === slot.id
                                ? 'border-[#e14171] bg-pink-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <Clock className={`h-4 w-4 ${deliverySlot === slot.id ? 'text-[#e14171]' : 'text-gray-400'}`} />
                              <span className={`font-medium text-sm ${deliverySlot === slot.id ? 'text-[#e14171]' : ''}`}>{slot.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!deliveryDate && (
                    <p className="text-sm text-gray-500 italic">Please select a delivery date</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">Please complete pickup selection first</p>
              )}
            </div>

            {/* Selection Summary */}
            {pickupDate && pickupSlot && deliveryDate && deliverySlot && (
              <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200">
                <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Schedule Summary
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Pickup</div>
                    <div className="font-semibold text-gray-900">
                      {availableDates.find(d => d.date === pickupDate)?.fullDisplay}
                    </div>
                    <div className="text-[#e14171] font-medium">
                      {timeSlots.find(s => s.id === pickupSlot)?.label}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Delivery</div>
                    <div className="font-semibold text-gray-900">
                      {availableDates.find(d => d.date === deliveryDate)?.fullDisplay}
                    </div>
                    <div className="text-[#e14171] font-medium">
                      {timeSlots.find(s => s.id === deliverySlot)?.label}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Preferences */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-[#e14171]" />
                Delivery Preferences
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drop-off Instructions
                </label>
                <select
                  value={deliveryPrefs.dropoffInstructions}
                  onChange={(e) => {
                    setDeliveryPrefs({ ...deliveryPrefs, dropoffInstructions: e.target.value });
                    if (e.target.value !== 'custom') {
                      setCustomDropoffInstruction('');
                    }
                  }}
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171] bg-white"
                >
                  <option value="">Select an option...</option>
                  <option value="security">Leave with Security/Doorman</option>
                  <option value="gate">Hang on the gate hook</option>
                  <option value="wait">Ring bell and wait</option>
                  <option value="custom">Custom instructions</option>
                </select>
                
                {/* Custom instruction text input - shows when "custom" is selected */}
                {deliveryPrefs.dropoffInstructions === 'custom' && (
                  <div className="mt-4 p-4 bg-pink-50 border-2 border-[#e14171] rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter Your Custom Instructions
                    </label>
                    <textarea
                      value={customDropoffInstruction}
                      onChange={(e) => setCustomDropoffInstruction(e.target.value)}
                      placeholder="e.g., 'Leave with the neighbor at apartment 3B' or 'Place inside the blue bin by the front door'"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171] focus:border-[#e14171] resize-none bg-white"
                      rows={3}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Please provide clear instructions for our driver.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Packaging</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'plastic', label: 'Plastic Bag', desc: 'Rain protection' },
                    { id: 'paper', label: 'Eco Paper', desc: 'Sustainable' },
                    { id: 'reusable', label: 'Reusable', desc: 'For members' },
                  ].map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setDeliveryPrefs({ ...deliveryPrefs, packagingType: pkg.id as DeliveryPreferences['packagingType'] })}
                      className={`p-3 rounded-lg border-2 ${
                        deliveryPrefs.packagingType === pkg.id
                          ? 'border-[#e14171] bg-pink-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="text-sm font-medium">{pkg.label}</div>
                      <div className="text-xs text-gray-500">{pkg.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notifications</label>
                <div className="space-y-2">
                  {[
                    { id: 'whatsapp', label: 'WhatsApp updates', icon: MessageSquare },
                    { id: 'sms', label: 'SMS only when delivered', icon: Smartphone },
                    { id: 'quiet', label: 'Quiet delivery (photo only)', icon: Info },
                  ].map((notif) => (
                    <label
                      key={notif.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                        deliveryPrefs.notificationStyle === notif.id
                          ? 'border-[#e14171] bg-pink-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="notification"
                        checked={deliveryPrefs.notificationStyle === notif.id}
                        onChange={() => setDeliveryPrefs({ ...deliveryPrefs, notificationStyle: notif.id as DeliveryPreferences['notificationStyle'] })}
                        className="w-4 h-4 text-[#e14171]"
                      />
                      <notif.icon className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-700">{notif.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Checkout */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Pay</h2>
              <p className="text-gray-600">Confirm your order details.</p>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Location</span>
                  <span className="text-gray-900 text-right">
                    {location.address}<br />
                    <span className="text-sm text-gray-500">{location.landmark}</span>
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Service</span>
                  <span className="text-gray-900 capitalize">
                    {serviceType === 'multiple' ? 'Multiple Services' : serviceType ? serviceType.replace('-', ' ') : 'Not selected'}
                  </span>
                </div>

                {(serviceType === 'laundry' || serviceType === 'multiple') && bagSize && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">
                      {bagSize === 'regular' ? regularBagProduct?.name : largeBagProduct?.name}
                      {hangDry && hangDryProduct && ` + ${hangDryProduct.name}`}
                    </span>
                    <span className="text-gray-900">
                      ${bagSize === 'regular' ? regularBagProduct?.price : largeBagProduct?.price}
                      {hangDry && hangDryProduct && ` + $${hangDryProduct.price}`}
                    </span>
                  </div>
                )}

                {suitItems.length > 0 && (
                  <div className="py-2 border-b">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Suit Cleaning</span>
                    </div>
                    {suitItems.map((itemId) => {
                      const item = suitOptions.find(o => o.id === itemId);
                      return item ? (
                        <div key={itemId} className="flex justify-between text-sm text-gray-500 ml-4">
                          <span>{item.name}</span>
                          <span>{item.price}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {shoeItems.length > 0 && (
                  <div className="py-2 border-b">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Shoe Cleaning</span>
                    </div>
                    {shoeItems.map((itemId) => {
                      const item = shoeOptions.find(o => o.id === itemId);
                      return item ? (
                        <div key={itemId} className="flex justify-between text-sm text-gray-500 ml-4">
                          <span>{item.name}</span>
                          <span>{item.price}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {dryCleanItems.length > 0 && (
                  <div className="py-2 border-b">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Dry Cleaning</span>
                    </div>
                    {dryCleanItems.map((itemId) => {
                      const item = dryCleaningOptions.find(o => o.id === itemId);
                      return item ? (
                        <div key={itemId} className="flex justify-between text-sm text-gray-500 ml-4">
                          <span>{item.name}</span>
                          <span>{item.price}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Pickup</span>
                  <span className="text-gray-900 text-right">
                    <div>{availableDates.find(d => d.date === pickupDate)?.fullDisplay}</div>
                    <div className="text-sm text-[#e14171]">{timeSlots.find(s => s.id === pickupSlot)?.label}</div>
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Delivery</span>
                  <span className="text-gray-900 text-right">
                    <div>{availableDates.find(d => d.date === deliveryDate)?.fullDisplay}</div>
                    <div className="text-sm text-[#e14171]">{timeSlots.find(s => s.id === deliverySlot)?.label}</div>
                  </span>
                </div>

                {deliveryPrefs.dropoffInstructions && (
                  <div className="py-2 border-b">
                    <span className="text-gray-600">Drop-off Instructions</span>
                    <p className="text-gray-900 text-sm mt-1">
                      {deliveryPrefs.dropoffInstructions === 'security' && 'Leave with Security/Doorman'}
                      {deliveryPrefs.dropoffInstructions === 'gate' && 'Hang on the gate hook'}
                      {deliveryPrefs.dropoffInstructions === 'wait' && 'Ring bell and wait'}
                      {deliveryPrefs.dropoffInstructions === 'custom' && customDropoffInstruction}
                    </p>
                  </div>
                )}

                {(addons.stainTreatment || addons.whitening || addons.scentBoosters || addons.repairs) && (
                  <div className="py-2 border-b">
                    <div className="text-gray-600 mb-2">Add-ons:</div>
                    <div className="space-y-1 text-sm">
                      {addons.stainTreatment && (() => {
                        const p = addonProducts.find(p => p.name.toLowerCase().includes('stain'));
                        return p ? <div className="flex justify-between"><span>{p.name}</span><span>${p.price}</span></div> : null;
                      })()}
                      {addons.whitening && (() => {
                        const p = addonProducts.find(p => p.name.toLowerCase().includes('whiten'));
                        return p ? <div className="flex justify-between"><span>{p.name}</span><span>${p.price}</span></div> : null;
                      })()}
                      {addons.scentBoosters && (() => {
                        const p = addonProducts.find(p => p.name.toLowerCase().includes('scent'));
                        return p ? <div className="flex justify-between"><span>{p.name}</span><span>${p.price}</span></div> : null;
                      })()}
                      {addons.repairs && (() => {
                        const p = addonProducts.find(p => p.name.toLowerCase().includes('button') || (p.name.toLowerCase().includes('repair') && !p.name.toLowerCase().includes('minor')));
                        return p ? <div className="flex justify-between"><span>{p.name}</span><span>${p.price}</span></div> : null;
                      })()}
                    </div>
                  </div>
                )}

                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-900">${computePricing().orderDeliveryFee.toFixed(2)}</span>
                </div>

                {/* Promo Code Section */}
                <div className="py-4 border-b">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="h-4 w-4 inline mr-1" />
                    Promo Code
                  </label>
                  
                  {!appliedPromo ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value.toUpperCase());
                            setPromoMessage('');
                            setPromoError(false);
                          }}
                          placeholder="Enter promo code"
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171] uppercase ${
                            promoError ? 'border-red-300' : 'border-gray-200'
                          }`}
                        />
                      </div>
                      <button
                        onClick={async () => {
                          const subtotal = calculateTotal();
                          const result = await applyPromoCode(promoCode, subtotal + deliveryFee, deliveryFee);
                          setPromoMessage(result.message);
                          setPromoError(!result.valid);
                        }}
                        disabled={promoLoading || !promoCode.trim()}
                        className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                          promoLoading || !promoCode.trim()
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-[#e14171] text-white hover:bg-[#c73562]'
                        }`}
                      >
                        {promoLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 border-2 border-green-200 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Percent className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-green-800">{appliedPromo.code}</div>
                          <div className="text-sm text-green-600">
                            {appliedPromo.discount_type === 'percentage' && `${appliedPromo.discount_value}% off`}
                            {appliedPromo.discount_type === 'fixed' && `$${appliedPromo.discount_value} off`}
                            {appliedPromo.discount_type === 'free_delivery' && 'Free delivery'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          removePromoCode();
                          setPromoCode('');
                          setPromoMessage('');
                          setPromoError(false);
                        }}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}

                  {promoMessage && !appliedPromo && (
                    <p className={`mt-2 text-sm ${promoError ? 'text-red-500' : 'text-green-600'}`}>
                      {promoMessage}
                    </p>
                  )}

                  {/* Available promo codes hint */}
                  {!appliedPromo && (
                    <div className="mt-3 text-xs text-gray-500">
                      <span className="font-medium">Try:</span> WELCOME10, BUBBLE20, FREESHIP
                    </div>
                  )}
                </div>

                {/* Credits */}
                <div className="py-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Apply credits</p>
                      <p className="text-xs text-gray-500">
                        Available: ${creditBalance.toFixed(2)}
                      </p>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <span className="text-sm text-gray-600">Use credits</span>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-[#e14171] rounded"
                        checked={applyCredits}
                        disabled={creditBalance <= 0}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setApplyCredits(checked);
                          if (checked) {
                            const { maxCredit } = computePricing();
                            setCreditToApply(Math.min(maxCredit, creditBalance));
                          } else {
                            setCreditToApply(0);
                          }
                        }}
                      />
                    </label>
                  </div>
                  {applyCredits && creditBalance > 0 && (
                    <div className="mt-2 space-y-1">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={creditToApply}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const { maxCredit } = computePricing();
                          setCreditToApply(Math.max(0, Math.min(val, maxCredit)));
                        }}
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                      />
                      <p className="text-xs text-gray-500">
                        You can apply up to ${computePricing().maxCredit.toFixed(2)} on this order.
                      </p>
                    </div>
                  )}
                </div>

                {/* Discount Display */}
                {appliedPromo && discountAmount > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      Discount ({appliedPromo.code})
                    </span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {applyCredits && computePricing().appliedCredit > 0 && (
                  <div className="flex justify-between py-2 text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      Credits Applied
                    </span>
                    <span>-${computePricing().appliedCredit.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 mt-4 border-t-2">
                <span className="text-lg font-bold text-gray-900">Estimated Total</span>
                <span className="text-lg font-bold text-[#e14171]">${computePricing().payable.toFixed(2)}</span>
              </div>

              <div className="mt-4 bg-pink-50 rounded-xl p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-[#e14171] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <strong>Note:</strong> We'll place a $20 authorization hold. Final charge is calculated after processing your items. You'll receive the exact amount via WhatsApp.
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
              <div className="space-y-3">
                {/* Credit/Debit Card Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all text-left ${paymentMethod === 'card' ? 'border-[#e14171] bg-pink-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-[#e14171]' : 'border-gray-400'}`}>
                    {paymentMethod === 'card' && <div className="w-3 h-3 rounded-full bg-[#e14171]" />}
                  </div>
                  <CreditCard className={`h-5 w-5 ${paymentMethod === 'card' ? 'text-[#e14171]' : 'text-gray-600'}`} />
                  <div className="flex-1">
                    <span className="font-medium block">Credit/Debit Card</span>
                    <p className="text-sm text-gray-500">Secure online payment</p>
                  </div>
                </button>

                {/* Cash on Delivery Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all text-left ${paymentMethod === 'cash' ? 'border-[#e14171] bg-pink-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-[#e14171]' : 'border-gray-400'}`}>
                    {paymentMethod === 'cash' && <div className="w-3 h-3 rounded-full bg-[#e14171]" />}
                  </div>
                  <Banknote className={`h-5 w-5 ${paymentMethod === 'cash' ? 'text-[#e14171]' : 'text-gray-600'}`} />
                  <div className="flex-1">
                    <span className="font-medium block">Cash on Delivery</span>
                    <p className="text-sm text-gray-500">Pay when your order arrives</p>
                  </div>
                </button>

                {/* Digital Wallet Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all text-left ${paymentMethod === 'wallet' ? 'border-[#e14171] bg-pink-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'wallet' ? 'border-[#e14171]' : 'border-gray-400'}`}>
                    {paymentMethod === 'wallet' && <div className="w-3 h-3 rounded-full bg-[#e14171]" />}
                  </div>
                  <Smartphone className={`h-5 w-5 ${paymentMethod === 'wallet' ? 'text-[#e14171]' : 'text-gray-600'}`} />
                  <div className="flex-1">
                    <span className="font-medium block">Digital Wallet</span>
                    <p className="text-sm text-gray-500">Apple Pay, Google Pay, etc.</p>
                  </div>
                </button>
              </div>

              {/* Card payment fields - only show if card is selected */}
              {paymentMethod === 'card' && (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Card Number"
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded text-[#e14171]" />
                    <span className="text-gray-700">Save card for future orders</span>
                  </label>
                </div>
              )}

              {/* Cash payment info */}
              {paymentMethod === 'cash' && (
                <div className="mt-4 bg-yellow-50 rounded-xl p-4 flex items-start gap-3">
                  <Banknote className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <strong>Cash Payment:</strong> Please have the exact amount ready when our driver arrives. The final amount will be confirmed via WhatsApp after we weigh your items.
                  </div>
                </div>
              )}

              {/* Wallet payment info */}
              {paymentMethod === 'wallet' && (
                <div className="mt-4 bg-blue-50 rounded-xl p-4 flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <strong>Digital Wallet:</strong> You'll be redirected to complete the payment after placing your order.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep((step - 1) as BookingStep)}
              className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-gray-300 rounded-full font-medium text-gray-700 hover:bg-gray-50"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>
          )}
          <button
            onClick={async () => {
              if (step < 4) {
                setStep((step + 1) as BookingStep);
              } else {
                // Place Order
                if (!user) {
                  setShowAuthModal(true);
                  return;
                }

                setIsSubmitting(true);
                try {
                  // Build items array
                  const items: { itemType: string; itemName: string; quantity: number; unitPrice: number; }[] = [];
                  
                  if ((serviceType === 'laundry' || serviceType === 'multiple') && bagSize) {
                    const bagProduct = bagSize === 'regular' ? regularBagProduct : largeBagProduct;
                    if (bagProduct) {
                      items.push({
                        itemType: 'laundry_bag',
                        itemName: bagProduct.name,
                        quantity: 1,
                        unitPrice: bagProduct.price
                      });
                    }
                    if (hangDry && hangDryProduct) {
                      items.push({ itemType: 'addon', itemName: hangDryProduct.name, quantity: 1, unitPrice: hangDryProduct.price });
                    }
                  }
                  
                  suitItems.forEach(itemId => {
                    const item = suitOptions.find(o => o.id === itemId);
                    if (item) {
                      items.push({
                        itemType: 'suit',
                        itemName: item.name,
                        quantity: 1,
                        unitPrice: item.priceNum
                      });
                    }
                  });
                  
                  shoeItems.forEach(itemId => {
                    const item = shoeOptions.find(o => o.id === itemId);
                    if (item) {
                      items.push({
                        itemType: 'shoe',
                        itemName: item.name,
                        quantity: 1,
                        unitPrice: item.priceNum
                      });
                    }
                  });
                  
                  dryCleanItems.forEach(itemId => {
                    const item = dryCleaningOptions.find(o => o.id === itemId);
                    if (item) {
                      items.push({
                        itemType: 'dry_clean',
                        itemName: item.name,
                        quantity: 1,
                        unitPrice: item.priceNum
                      });
                    }
                  });

                  const pricing = computePricing();
                  const subtotal = pricing.subtotal;
                  const orderDeliveryFee = pricing.orderDeliveryFee;
                  const discount = pricing.discount;
                  const appliedCredit = pricing.appliedCredit;
                  const total = pricing.payable;

                  const order = await createOrder({
                    serviceType: serviceType!,
                    items,
                    preferences: {
                      detergentType: cleaningPrefs.detergent,
                      fabricSoftener: cleaningPrefs.softener,
                      waterTemp: cleaningPrefs.waterTemp,
                      dryingHeat: cleaningPrefs.dryingHeat,
                      foldingStyle: finishingPrefs.foldingStyle,
                      shirtsHung: finishingPrefs.shirtsHung,
                      pantsCreased: finishingPrefs.pantsCreased,
                      dropoffInstructions: deliveryPrefs.dropoffInstructions,
                      customDropoffInstruction: customDropoffInstruction,
                      packagingType: deliveryPrefs.packagingType,
                      notificationStyle: deliveryPrefs.notificationStyle
                    },
                    addons: {
                      stainTreatment: addons.stainTreatment,
                      whitening: addons.whitening,
                      scentBoosters: addons.scentBoosters,
                      repairs: addons.repairs,
                      stainNote: stainNote
                    },
                    pickupAddress: location.address,
                    pickupLandmark: location.landmark,
                    paymentMethod: paymentMethod!,
                    subtotal,
                    deliveryFee: orderDeliveryFee,
                    discount,
                    promoCode: appliedPromo?.code || null,
                    total
                  });

                  // Apply credits after order is created
                  if (appliedCredit > 0) {
                    const creditResult = await useCredits(appliedCredit, order.id);
                    if (!creditResult.success) {
                      alert(`We couldn't record your credit usage: ${creditResult.message}`);
                    }
                    const newBal = await getCreditBalance();
                    setCreditBalance(newBal);
                    setApplyCredits(false);
                    setCreditToApply(0);
                  }

                  // Increment promo code usage if one was applied
                  if (appliedPromo) {
                    await incrementPromoUsage(appliedPromo.id);
                  }

                  // Save address if user opted to
                  if (saveThisAddress && addressLabel.trim()) {
                    await addAddress({
                      label: addressLabel.trim(),
                      address: location.address,
                      landmark: location.landmark,
                      is_default: addresses.length === 0
                    });
                  }

                  // Success! Navigate to portal
                  alert('Order placed successfully! You will receive a confirmation via WhatsApp.');
                  navigate('/portal');
                } catch (error: unknown) {
                  console.error('Error creating order:', error);
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                  alert(`There was an error placing your order: ${errorMessage}`);
                } finally {
                  setIsSubmitting(false);
                }
              }
            }}
            disabled={!canProceed() || isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full font-semibold transition-colors ${
              canProceed() && !isSubmitting
                ? 'bg-[#e14171] text-white hover:bg-[#c73562]'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {step === 4 ? 'Place Order' : 'Continue'}
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </div>
  );
}
