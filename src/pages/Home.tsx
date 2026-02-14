import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Truck, 
  Sparkles, 
  Shield, 
  Star, 
  ChevronRight,
  CheckCircle,
  Package,
  Timer,
  Shirt,
  Loader2,
  Crown
} from 'lucide-react';
import { useReviews } from '../hooks/useReviews';
import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans';
import { useNewsletter } from '../hooks/useNewsletter';

export function Home() {
  const [locationInput, setLocationInput] = useState('');
  const [isValidLocation, setIsValidLocation] = useState<boolean | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const { reviews, loading: reviewsLoading, getFeaturedReviews } = useReviews();
  const { plans, loading: plansLoading, fetchPlans } = useSubscriptionPlans();
  const { subscribe, loading: newsletterLoading, message: newsletterMsg, error: newsletterError, clear: newsletterClear } = useNewsletter();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Get the Bubble Pass plan (the "popular" or middle tier plan)
  const bubblePassPlan = plans.find(p => p.slug === 'bubble-pass') || plans.find(p => p.is_popular) || null;

  // Fetch reviews and plans on mount
  useEffect(() => {
    getFeaturedReviews();
    fetchPlans();
  }, []);

  const validateLocation = () => {
    // Simulate location validation
    if (locationInput.length > 5) {
      setIsValidLocation(true);
    } else {
      setIsValidLocation(false);
    }
  };

  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported in this browser.');
      return;
    }
    if (!window.isSecureContext) {
      setLocError('Location requires HTTPS or localhost. Please open the site over https:// or http://localhost.');
      return;
    }
    setLocError(null);
    setLocLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode for a friendly address
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&email=dev@bubblebox.com`,
        { headers: { Accept: 'application/json', 'User-Agent': 'bubblebox-app/1.0' } }
      );
      const data = await res.json();
      const display = data?.display_name as string | undefined;
      setLocationInput(display || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      setIsValidLocation(true);
    } catch (error: any) {
      console.error('Geolocation error', error);
      if (error?.code === 1) {
        setLocError('Permission denied. Click the lock icon in your browser and allow location, then try again.');
      } else if (error?.code === 2) {
        setLocError('Position unavailable. Please check your connection/GPS and retry.');
      } else if (error?.code === 3) {
        setLocError('Timed out fetching location. Please retry.');
      } else {
        setLocError(error?.message || 'Please allow location access and try again.');
      }
    } finally {
      setLocLoading(false);
    }
  };

  // Fallback testimonials if no reviews in database
  const fallbackTestimonials = [
    {
      customer_name: 'Sarah M.',
      customer_location: 'Downtown',
      rating: 5,
      comment: 'The Bubble Box has transformed my weekly routine. No more laundry days!',
      service_type: 'laundry'
    },
    {
      customer_name: 'James L.',
      customer_location: 'Westside',
      rating: 5,
      comment: 'The 24h turnaround is incredible. My suits have never looked better.',
      service_type: 'suit'
    },
    {
      customer_name: 'Maria K.',
      customer_location: 'Northgate',
      rating: 5,
      comment: 'Amazing shoe cleaning service. My sneakers look brand new!',
      service_type: 'shoe'
    }
  ];

  // Use database reviews if available, otherwise use fallback
  const testimonials = reviews.length > 0 ? reviews : fallbackTestimonials;

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6 animate-[float_6s_ease-in-out_infinite]">
                <img
                  src="https://af6815798a.imgdist.com/pub/bfra/knkjywkm/2no/pvb/dgk/logocroped-removebg-preview.png"
                  alt="The Bubble Box Logo"
                  className="h-24 w-24 rounded-full object-cover shadow-2xl"
                />
                <div>
                  <p className="text-sm text-[#e14171] font-semibold">Bubble Box</p>
                  <p className="text-lg font-semibold text-white">Premium Pickup & Delivery</p>
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                Premium Cleaning,<br /><span className="text-[#e14171]">Delivered to Your Door</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Expert laundry, suit cleaning, shoe restoration & dry cleaning with free pickup & delivery. 
                Save time for what matters most.
              </p>
              
              {/* Location Validator */}
              <div className="bg-white rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="h-5 w-5 text-[#e14171]" />
                  <span className="text-gray-700 font-medium">Check if we deliver to you</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter your address or drop a pin..."
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                  />
                  <button
                    onClick={validateLocation}
                    className="px-6 py-3 bg-[#e14171] text-white rounded-xl font-medium hover:bg-[#c73562] transition-colors"
                  >
                    Check
                  </button>
                </div>
                {isValidLocation !== null && (
                  <div className={`mt-3 flex items-center gap-2 ${isValidLocation ? 'text-green-600' : 'text-red-500'}`}>
                    {isValidLocation ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Great news! We deliver to your area.</span>
                      </>
                    ) : (
                      <>
                        <span>⚠️</span>
                        <span className="font-medium">Please enter a valid address with landmark</span>
                      </>
                    )}
                  </div>
                )}
                <button
                  onClick={useMyLocation}
                  disabled={locLoading}
                  className="mt-3 flex items-center gap-2 text-[#e14171] text-sm font-medium disabled:text-gray-400"
                >
                  {locLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  Use my current location
                </button>
                {locError && <p className="text-xs text-red-500 mt-1">{locError}</p>}
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-[#e14171] rounded-full opacity-20 blur-3xl"></div>
                <img
                  src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600&h=500&fit=crop"
                  alt="Fresh folded laundry"
                  className="rounded-2xl shadow-2xl relative z-10"
                />
                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-xl z-20">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 p-2 rounded-full">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold">Order Complete!</p>
                      <p className="text-gray-500 text-sm">Delivered in 24h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Services Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From everyday laundry to specialized suit and shoe cleaning, we handle it all with care.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Package, title: 'Laundry Services', desc: 'Wash, fold & iron', color: 'bg-pink-100 text-[#e14171]' },
              { icon: Shirt, title: 'Suit Cleaning', desc: 'Professional care', color: 'bg-gray-100 text-gray-800' },
              { icon: Sparkles, title: 'Shoe Cleaning', desc: 'Restore & refresh', color: 'bg-pink-100 text-[#e14171]' },
              { icon: Star, title: 'Dry Cleaning', desc: 'Delicate fabrics', color: 'bg-gray-100 text-gray-800' },
            ].map((service, idx) => (
              <Link
                key={idx}
                to="/services"
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-all hover:-translate-y-1 group"
              >
                <div className={`w-14 h-14 ${service.color} rounded-xl flex items-center justify-center mb-4`}>
                  <service.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm">{service.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Block */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="bg-gradient-to-br from-[#e14171] to-pink-600 rounded-3xl p-8 transform rotate-3">
                  <Sparkles className="h-32 w-32 text-white/90" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white rounded-xl p-3 shadow-lg">
                  <p className="text-sm font-medium text-gray-800">Premium Quality</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Your Items in Safe Hands
              </h2>
              <ul className="space-y-4">
                {[
                  { icon: Shield, text: 'Sanitized Process - Hospital-grade cleaning standards' },
                  { icon: Package, text: 'Separate Care - Your items never mix with others' },
                  { icon: Timer, text: '24h Turnaround - Order today, receive tomorrow' },
                  { icon: Sparkles, text: 'Expert Technicians - Trained specialists for each service' }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="bg-[#e14171]/20 p-2 rounded-lg">
                      <item.icon className="h-5 w-5 text-[#e14171]" />
                    </div>
                    <span className="text-gray-300">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Getting your items cleaned has never been easier. Three simple steps to fresh, clean results.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: MapPin,
                title: 'Schedule Pickup',
                description: 'Choose a 2-hour window that works for you. Our driver comes right to your door.'
              },
              {
                step: '2',
                icon: Sparkles,
                title: 'We Clean & Care',
                description: 'Your items are cleaned according to your preferences. Track progress in real-time.'
              },
              {
                step: '3',
                icon: Truck,
                title: 'Fresh Delivery',
                description: 'Receive your perfectly cleaned items, packaged exactly how you like.'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-[#e14171] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <item.icon className="h-8 w-8 text-[#e14171]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 bg-[#e14171] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#c73562] transition-colors"
            >
              Get Started Today
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-[#e14171]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-white text-center">
            {[
              { number: '50K+', label: 'Happy Customers' },
              { number: '24h', label: 'Avg. Turnaround' },
              { number: '99%', label: 'Satisfaction Rate' },
              { number: '500+', label: 'Daily Pickups' }
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.number}</div>
                <div className="text-pink-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bubble Pass Promo */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-black to-gray-900 rounded-3xl p-8 md:p-12 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e14171] rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500 rounded-full opacity-10 blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#e14171]/20 text-[#e14171] px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Crown className="h-4 w-4" />
                  Exclusive Membership
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {plansLoading ? 'The Bubble Box Pass' : (bubblePassPlan?.name || 'The Bubble Box Pass')}
                </h2>
                <p className="text-gray-300 text-lg mb-6">
                  {bubblePassPlan?.description || 'Get unlimited free delivery and exclusive member discounts.'}
                </p>
                
                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {bubblePassPlan?.features && bubblePassPlan.features.length > 0 ? (
                    bubblePassPlan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-gray-300">
                        <CheckCircle className="h-5 w-5 text-[#e14171] flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-center gap-3 text-gray-300">
                        <CheckCircle className="h-5 w-5 text-[#e14171] flex-shrink-0" />
                        <span>Free pickup & delivery (normally $5)</span>
                      </li>
                      <li className="flex items-center gap-3 text-gray-300">
                        <CheckCircle className="h-5 w-5 text-[#e14171] flex-shrink-0" />
                        <span>10% off all services</span>
                      </li>
                      <li className="flex items-center gap-3 text-gray-300">
                        <CheckCircle className="h-5 w-5 text-[#e14171] flex-shrink-0" />
                        <span>Priority scheduling</span>
                      </li>
                      <li className="flex items-center gap-3 text-gray-300">
                        <CheckCircle className="h-5 w-5 text-[#e14171] flex-shrink-0" />
                        <span>Exclusive member promotions</span>
                      </li>
                    </>
                  )}
                </ul>
                
                <Link
                  to="/subscription"
                  className="inline-flex items-center gap-2 bg-[#e14171] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#c73562] transition-colors"
                >
                  Learn More About Bubble Pass
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
              
              {/* Price Card */}
              <div className="flex justify-center md:justify-end">
                <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-xs w-full">
                  <div className="text-center">
                    <div className="bg-[#e14171]/10 text-[#e14171] px-3 py-1 rounded-full text-sm font-medium inline-block mb-4">
                      Most Popular
                    </div>
                    <div className="mb-4">
                      {plansLoading ? (
                        <div className="flex justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
                        </div>
                      ) : (
                        <>
                          <span className="text-5xl font-bold text-gray-900">
                            ${bubblePassPlan?.monthly_price?.toFixed(2) || '9.99'}
                          </span>
                          <span className="text-gray-500 ml-2">per month</span>
                        </>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm mb-6">
                      or ${bubblePassPlan?.yearly_price?.toFixed(2) || '99.99'}/year (save {bubblePassPlan ? Math.round(((bubblePassPlan.monthly_price * 12 - bubblePassPlan.yearly_price) / (bubblePassPlan.monthly_price * 12)) * 100) : 17}%)
                    </p>
                    <Link
                      to="/subscription"
                      className="block w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Get Bubble Pass
                    </Link>
                    <p className="text-gray-400 text-xs mt-4">
                      Cancel anytime. No commitment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-gray-600">Real reviews from our valued customers</p>
          </div>
          
          {reviewsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.slice(0, 6).map((testimonial, idx) => (
                <div key={idx} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-[#e14171] text-[#e14171]" />
                    ))}
                    {[...Array(5 - testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-gray-300" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6">&ldquo;{testimonial.comment}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e14171] to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.customer_name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 block">{testimonial.customer_name}</span>
                        {testimonial.customer_location && (
                          <span className="text-gray-500 text-sm">{testimonial.customer_location}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full capitalize">
                      {testimonial.service_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No reviews yet. Be the first to experience our service!</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Opt-in (bottom) */}
      <section className="bg-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#e14171]">Monthly Newsletter</p>
                <h3 className="text-xl font-bold text-gray-900">Get deals, care tips, and service updates</h3>
                <p className="text-sm text-gray-600">
                  Opt in to marketing emails. You can unsubscribe anytime (transactional emails will still arrive).
                </p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  newsletterClear();
                  await subscribe(newsletterEmail);
                }}
                className="flex flex-col sm:flex-row gap-3 w-full md:w-auto"
              >
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => {
                    newsletterClear();
                    setNewsletterEmail(e.target.value);
                  }}
                  placeholder="you@example.com"
                  className="flex-1 min-w-[240px] px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e14171]"
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="px-5 py-3 bg-[#e14171] text-white rounded-xl font-semibold hover:bg-[#c73562] disabled:opacity-50"
                >
                  {newsletterLoading ? 'Subscribing…' : 'Subscribe'}
                </button>
              </form>
            </div>
            {(newsletterMsg || newsletterError) && (
              <div
                className={`mt-4 p-3 rounded-xl text-sm ${
                  newsletterMsg ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {newsletterMsg || newsletterError}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Reclaim Your Time?
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of customers who have made cleaning day a thing of the past.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 bg-[#e14171] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#c73562] transition-colors"
            >
              Book Your First Pickup
              <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-[#e14171] p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">The Bubble Box</span>
              </div>
              <p className="text-gray-400">Premium cleaning services with free pickup and delivery.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/services" className="hover:text-[#e14171]">Laundry Services</Link></li>
                <li><Link to="/services" className="hover:text-[#e14171]">Suit Cleaning</Link></li>
                <li><Link to="/services" className="hover:text-[#e14171]">Shoe Cleaning</Link></li>
                <li><Link to="/services" className="hover:text-[#e14171]">Dry Cleaning</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/pricing" className="hover:text-[#e14171]">Pricing</Link></li>
                <li><Link to="/subscription" className="hover:text-[#e14171]">Bubble Pass</Link></li>
                <li><a href="#" className="hover:text-[#e14171]">About Us</a></li>
                <li><a href="#" className="hover:text-[#e14171]">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-[#e14171]">Help Center</a></li>
                <li><a href="#" className="hover:text-[#e14171]">WhatsApp Support</a></li>
                <li><a href="#" className="hover:text-[#e14171]">Terms of Service</a></li>
                <li><a href="#" className="hover:text-[#e14171]">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
      <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
        <p>&copy; 2024 The Bubble Box. All rights reserved.</p>
      </div>
    </div>
  </footer>
</div>
  );
}
