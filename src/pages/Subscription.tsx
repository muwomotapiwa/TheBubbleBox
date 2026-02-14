import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  X, 
  Truck, 
  Percent, 
  Calendar, 
  Gift,
  Star,
  ChevronRight,
  Crown,
  Check,
  Loader2
} from 'lucide-react';
import { useSubscriptionPlans } from '../hooks/useSubscriptionPlans';

export function Subscription() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { plans: dbPlans, loading } = useSubscriptionPlans();

  // Convert database plans to the format used in the component
  const [plans, setPlans] = useState([
    {
      name: 'Basic',
      slug: 'basic',
      description: 'Perfect for occasional use',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        { text: 'Standard pricing', included: true },
        { text: '$5 delivery fee per order', included: true },
        { text: 'Email support', included: true },
        { text: 'Order tracking', included: true },
        { text: 'Free delivery', included: false },
        { text: 'Member discounts', included: false },
        { text: 'Priority scheduling', included: false },
      ],
      cta: 'Current Plan',
      popular: false
    },
    {
      name: 'Bubble Pass',
      slug: 'bubble-pass',
      description: 'Best value for regulars',
      monthlyPrice: 9.99,
      yearlyPrice: 99,
      features: [
        { text: 'Standard pricing', included: true },
        { text: 'FREE delivery on all orders', included: true },
        { text: 'WhatsApp priority support', included: true },
        { text: 'Real-time order tracking', included: true },
        { text: '10% off all services', included: true },
        { text: 'Priority scheduling', included: true },
        { text: 'Monthly surprise perks', included: true },
      ],
      cta: 'Get Bubble Pass',
      popular: true
    },
    {
      name: 'Family Pass',
      slug: 'family-pass',
      description: 'For households with heavy loads',
      monthlyPrice: 19.99,
      yearlyPrice: 199,
      features: [
        { text: 'All Bubble Pass benefits', included: true },
        { text: '15% off all services', included: true },
        { text: 'Up to 4 family members', included: true },
        { text: 'Free bag upgrades', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Same-day service available', included: true },
        { text: 'Free minor repairs', included: true },
      ],
      cta: 'Get Family Pass',
      popular: false
    }
  ]);

  // Update plans when database plans load
  useEffect(() => {
    if (dbPlans.length > 0) {
      setPlans(prevPlans => prevPlans.map(plan => {
        const dbPlan = dbPlans.find(p => p.slug === plan.slug);
        if (dbPlan) {
          return {
            ...plan,
            name: dbPlan.name,
            description: dbPlan.description,
            monthlyPrice: dbPlan.monthly_price,
            yearlyPrice: dbPlan.yearly_price,
            popular: dbPlan.is_popular,
            features: dbPlan.features.length > 0 
              ? dbPlan.features.map(f => ({ text: f, included: true }))
              : plan.features,
            cta: plan.slug === 'basic' ? 'Current Plan' : `Get ${dbPlan.name}`
          };
        }
        return plan;
      }));
    }
  }, [dbPlans]);

  const benefits = [
    {
      icon: Truck,
      title: 'Free Delivery Forever',
      description: 'Never pay for pickup or delivery again. Save $5+ per order.'
    },
    {
      icon: Percent,
      title: 'Member Discounts',
      description: 'Enjoy 10-15% off on all cleaning services.'
    },
    {
      icon: Calendar,
      title: 'Priority Scheduling',
      description: 'Book the best time slots before they fill up.'
    },
    {
      icon: Gift,
      title: 'Surprise Perks',
      description: 'Get monthly bonuses like free stain treatment or scent boosters.'
    }
  ];

  const faqs = [
    {
      q: 'How do I cancel my subscription?',
      a: 'You can cancel anytime from your account settings. No cancellation fees, and your benefits continue until the end of your billing period.'
    },
    {
      q: 'Can I pause my subscription?',
      a: 'Yes! Going on vacation? Pause your subscription for up to 3 months and resume when you\'re back.'
    },
    {
      q: 'Is there a minimum order requirement?',
      a: 'No minimum order required. Free delivery applies to all orders, even just a single item.'
    },
    {
      q: 'Can I share with family members?',
      a: 'The Family Pass allows up to 4 members. Each member gets their own login and can place orders independently.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <section className="bg-gradient-to-r from-black via-gray-900 to-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#e14171]/20 px-4 py-2 rounded-full mb-6">
            <Crown className="h-5 w-5 text-[#e14171]" />
            <span className="font-medium text-[#e14171]">Bubble Pass</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Unlimited Free Delivery.<br /><span className="text-[#e14171]">Exclusive Perks.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Join thousands of members who save time and money every month with Bubble Pass.
          </p>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-[#e14171] text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-[#e14171] text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              Yearly
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex items-center justify-center py-8 mb-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
              <span className="ml-3 text-gray-600">Loading pricing...</span>
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full ${
                  plan.popular ? 'ring-2 ring-[#e14171] shadow-xl' : 'shadow-sm'
                } ${selectedPlan === plan.name ? 'ring-2 ring-[#e14171] shadow-xl transform scale-[1.02]' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-[#e14171] text-white text-center py-2 text-sm font-medium">
                    <Star className="h-4 w-4 inline mr-1" />
                    Most Popular
                  </div>
                )}
                {selectedPlan === plan.name && !plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center py-2 text-sm font-medium">
                    <Check className="h-4 w-4 inline mr-1" />
                    Selected
                  </div>
                )}
                <div className={`flex flex-col h-full p-6 sm:p-8 ${plan.popular || selectedPlan === plan.name ? 'pt-12 sm:pt-14' : ''}`}>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">{plan.description}</p>
                  <div className="mb-4 sm:mb-6">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                      ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                    </span>
                    <span className="text-gray-500">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                    {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                      <div className="text-sm text-green-600 mt-1">
                        Save ${((plan.monthlyPrice * 12) - plan.yearlyPrice).toFixed(0)}/year
                      </div>
                    )}
                  </div>
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-2 sm:gap-3">
                        {feature.included ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm sm:text-base ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {plan.monthlyPrice === 0 ? (
                    <button 
                      onClick={() => setSelectedPlan(plan.name)}
                      className={`mt-auto w-full h-12 sm:h-14 rounded-full font-semibold transition-all duration-200 text-sm sm:text-base active:scale-95 flex items-center justify-center ${
                        selectedPlan === plan.name
                          ? 'bg-gray-900 text-white shadow-lg'
                          : 'bg-white border-2 border-gray-200 text-gray-700 shadow-sm hover:border-gray-400 hover:shadow-md'
                      }`}
                    >
                      {selectedPlan === plan.name ? 'Selected' : 'Select Basic'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setSelectedPlan(plan.name)}
                      className={`mt-auto w-full h-12 sm:h-14 rounded-full font-semibold transition-all duration-200 text-sm sm:text-base active:scale-95 flex items-center justify-center gap-2 ${
                        selectedPlan === plan.name
                          ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg'
                          : plan.popular
                          ? 'bg-[#e14171] text-white hover:bg-[#c73562] shadow-lg hover:shadow-xl'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm hover:shadow-md'
                      }`}
                    >
                      {selectedPlan === plan.name ? (
                        <span className="flex items-center justify-center gap-2">
                          <Check className="h-5 w-5" />
                          Selected
                        </span>
                      ) : plan.cta}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Continue Button - shows when a paid plan is selected */}
          {selectedPlan && selectedPlan !== 'Basic' && (
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/booking')}
                className="inline-flex items-center justify-center gap-2 bg-[#e14171] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#c73562] transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 text-sm sm:text-base"
              >
                Continue with {selectedPlan}
                <ChevronRight className="h-5 w-5" />
              </button>
              <p className="text-gray-500 text-sm mt-3">
                {billingCycle === 'yearly' ? 'Billed annually' : 'Billed monthly'} • Cancel anytime
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Member Benefits</h2>
            <p className="text-gray-600">Everything you get with your Bubble Pass subscription</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-2xl mb-4">
                  <benefit.icon className="h-8 w-8 text-[#e14171]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Savings Calculator */}
      <section className="py-16 bg-gradient-to-r from-[#e14171] to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">See Your Savings</h2>
              <p className="text-pink-100 mb-6">
                If you use our services just twice a month, you're already saving money with Bubble Pass.
              </p>
              <div className="bg-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-pink-100">2 orders/month × $5 delivery</span>
                  <span className="font-semibold">$10/month</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-pink-100">Bubble Pass cost</span>
                  <span className="font-semibold">-$9.99/month</span>
                </div>
                <div className="border-t border-white/20 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">You save</span>
                    <span className="text-2xl font-bold text-green-300">$0.01+</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-pink-100 mt-4">
                * Plus 10% off all services and exclusive perks!
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 sm:p-8 text-gray-900">
              <h3 className="text-lg sm:text-xl font-bold mb-4">Start saving today</h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Get your first month free when you sign up for an annual plan.
              </p>
              <button 
                onClick={() => {
                  setSelectedPlan('Bubble Pass');
                  setBillingCycle('yearly');
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                className="w-full bg-[#e14171] text-white py-3 sm:py-4 rounded-full font-medium hover:bg-[#c73562] transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95 shadow-lg hover:shadow-xl"
              >
                Get Bubble Pass Now
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Ready to Join Thousands of Happy Members?
          </h2>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Start your Bubble Pass subscription today.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button 
              onClick={() => {
                setSelectedPlan('Bubble Pass');
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2 bg-[#e14171] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:bg-[#c73562] transition-all duration-200 active:scale-95 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              Subscribe Now
              <ChevronRight className="h-5 w-5" />
            </button>
            <Link
              to="/booking"
              className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 active:scale-95 text-sm sm:text-base"
            >
              Try Without Subscribing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
